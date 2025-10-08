'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import JSZip from 'jszip';

interface COAFile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    size?: number;
    [key: string]: unknown;
  };
  viewerUrl: string;
  clientFolder?: string;
  strainName?: string;
}

export default function LiveCOAsPage() {
  const [coaFiles, setCOAFiles] = useState<COAFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [selectedCOAs, setSelectedCOAs] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [clientFolders, setClientFolders] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('all');

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch COA files from Supabase storage
  const fetchCOAFiles = async () => {
    try {
      setLoading(true);
      setError('');

      // First, list all folders in pdfs/
      const { data: folders, error: folderError } = await supabase.storage
        .from('coas')
        .list('pdfs', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (folderError) {
        if (folderError.message?.includes('not authorized') || folderError.message?.includes('Invalid JWT')) {
          throw new Error(
            'Access denied to private storage. Please ensure:\n' +
            '1. You are properly authenticated\n' +
            '2. Your credentials have read access to the bucket\n' +
            '3. RLS policies allow listing files'
          );
        }
        throw folderError;
      }

      const allCOAFiles: COAFile[] = [];
      const clientFolderNames: string[] = [];

      if (folders) {
        console.log('Raw folders list:', folders);

        // Filter only directories (folders don't have id and are not files)
        const folderNames = folders
          .filter(item => item.id === null && !item.name.includes('.'))
          .map(item => item.name);

        console.log('Client folder names found:', folderNames);
        clientFolderNames.push(...folderNames);

        // Fetch files from each folder
        for (const folderName of folderNames) {
          try {
            const { data: files, error: fileError } = await supabase.storage
              .from('coas')
              .list(`pdfs/${folderName}`, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
              });

            if (fileError) {
              console.error(`Error fetching files from ${folderName}:`, fileError);
              continue;
            }

            if (files) {
              console.log(`Files in ${folderName}:`, files.length);
              const folderFiles: COAFile[] = files
                .filter(file => file.name.endsWith('.pdf'))
                .map(file => {
                  const strainName = file.name.replace('.pdf', '');
                  const fullPath = `${folderName}/${file.name.replace('.pdf', '')}`;
                  return {
                    id: file.id || `${folderName}/${file.name}`,
                    name: file.name,
                    created_at: file.created_at || new Date().toISOString(),
                    updated_at: file.updated_at || new Date().toISOString(),
                    metadata: file.metadata,
                    viewerUrl: `https://www.quantixanalytics.com/coa/${fullPath}`,
                    clientFolder: folderName,
                    strainName: strainName
                  };
                });

              allCOAFiles.push(...folderFiles);
            }
          } catch (err) {
            console.error(`Error processing folder ${folderName}:`, err);
          }
        }

        // Check for files in root pdfs/ folder (legacy/uncategorized files with timestamp prefix)
        const rootFiles = folders.filter(item => item.id !== null && item.name.endsWith('.pdf'));
        console.log('Legacy root files found:', rootFiles.length);
        
        if (rootFiles.length > 0) {
          const rootCOAFiles: COAFile[] = rootFiles.map(file => {
            const cleanFilename = file.name.replace('.pdf', '');
            // Extract strain name from old format: timestamp_COA_StrainName_SampleID
            let displayName = cleanFilename;
            const coaMatch = cleanFilename.match(/_COA_(.+?)_QA\d+$/);
            if (coaMatch) {
              displayName = coaMatch[1].replace(/_/g, ' ');
            }
            
            return {
              id: file.id || file.name,
              name: file.name, // Keep the FULL original filename with timestamp
              created_at: file.created_at || new Date().toISOString(),
              updated_at: file.updated_at || new Date().toISOString(),
              metadata: file.metadata,
              viewerUrl: `https://www.quantixanalytics.com/coa/${cleanFilename}`,
              clientFolder: 'Legacy Files', // Mark as legacy instead of uncategorized
              strainName: displayName
            };
          });
          allCOAFiles.push(...rootCOAFiles);
          if (!clientFolderNames.includes('Legacy Files')) {
            clientFolderNames.push('Legacy Files');
          }
        }
      }

      setCOAFiles(allCOAFiles);
      setClientFolders(clientFolderNames.sort());
    } catch (err) {
      console.error('Error fetching COA files:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch COA files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchCOAFiles();
    }
  }, [mounted]);

  const filteredCOAs = coaFiles.filter(coa => {
    const matchesSearch = coa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coa.strainName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coa.clientFolder?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient === 'all' || coa.clientFolder === selectedClient;
    return matchesSearch && matchesClient;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || !mounted) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Unknown date';
    }
  };

  const handleViewCOA = (coa: COAFile) => {
    if (typeof window !== 'undefined') {
      window.open(coa.viewerUrl, '_blank');
    }
  };

  const handleCopyLink = async (url: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy link');
      }
    }
  };

  const handleDeleteCOA = async (coa: COAFile) => {
    if (typeof window === 'undefined') return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${coa.name}"?\n\nThis will permanently remove the file from cloud storage and make it inaccessible via www.quantixanalytics.com. This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingFiles(prev => new Set([...prev, coa.id]));

      // Construct the correct file path based on how files are stored
      let filePath: string;
      if (coa.clientFolder && coa.clientFolder !== 'Uncategorized' && coa.clientFolder !== 'Legacy Files') {
        // New files in client folders: pdfs/ClientName/StrainName.pdf
        filePath = `pdfs/${coa.clientFolder}/${coa.name}`;
      } else {
        // Legacy files in root OR uncategorized: pdfs/filename.pdf
        // Use the full filename which includes timestamp for legacy files
        filePath = `pdfs/${coa.name}`;
      }

      console.log('=== DELETE ATTEMPT START ===');
      console.log('Attempting to delete file at path:', filePath);
      console.log('COA details:', { 
        id: coa.id, 
        name: coa.name, 
        clientFolder: coa.clientFolder,
        strainName: coa.strainName 
      });

      const { data: deleteData, error: deleteError } = await supabase.storage
        .from('coas')
        .remove([filePath]);

      console.log('Delete response data:', deleteData);
      console.log('Delete response error:', deleteError);

      if (deleteError) {
        console.error('❌ DELETE FAILED - Error details:', deleteError);
        console.error('Error message:', deleteError.message);
        
        if (deleteError.message?.includes('not authorized') || deleteError.message?.includes('Invalid JWT')) {
          throw new Error(
            'Access denied: You do not have permission to delete files from private storage. Please ensure your credentials have delete access to the bucket.'
          );
        }
        throw new Error(`Failed to delete file: ${deleteError.message}`);
      }

      console.log('✅ Delete command executed without error');
      console.log('Delete result data:', JSON.stringify(deleteData));

      // Verify deletion by checking if file still exists
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for deletion to propagate
      
      const checkPath = coa.clientFolder && coa.clientFolder !== 'Uncategorized' && coa.clientFolder !== 'Legacy Files' 
        ? `pdfs/${coa.clientFolder}` 
        : 'pdfs';
      
      console.log('Verifying deletion by listing files in:', checkPath);
      const { data: checkData, error: checkError } = await supabase.storage
        .from('coas')
        .list(checkPath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (checkError) {
        console.error('Error verifying deletion:', checkError);
      } else {
        console.log('Files remaining in folder:', checkData?.length);
        const fileStillExists = checkData?.some(f => f.name === coa.name);
        console.log('File still exists after delete?', fileStillExists);
        if (fileStillExists) {
          console.error('⚠️ WARNING: File was not actually deleted from storage!');
        }
      }
      console.log('=== DELETE ATTEMPT END ===');

      // Remove from local state
      setCOAFiles(prev => prev.filter(file => file.id !== coa.id));
      
      // Remove from selected if it was selected
      setSelectedCOAs(prev => {
        const newSet = new Set(prev);
        newSet.delete(coa.id);
        return newSet;
      });
      
      // Show success message
      alert(`Successfully deleted "${coa.name}"`);

    } catch (err) {
      console.error('Error deleting COA:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete COA');
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(coa.id);
        return newSet;
      });
    }
  };

  const handleDeleteAll = async () => {
    if (typeof window === 'undefined' || filteredCOAs.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ALL ${filteredCOAs.length} COA(s)${searchTerm ? ` matching "${searchTerm}"` : ''}?\n\nThis will permanently remove all files from cloud storage and make them inaccessible via www.quantixanalytics.com. This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const filePaths = filteredCOAs.map(coa => {
        if (coa.clientFolder && coa.clientFolder !== 'Uncategorized' && coa.clientFolder !== 'Legacy Files') {
          return `pdfs/${coa.clientFolder}/${coa.name}`;
        }
        return `pdfs/${coa.name}`;
      });

      console.log('Attempting to delete multiple files:', filePaths);

      const { error: deleteError } = await supabase.storage
        .from('coas')
        .remove(filePaths);

      if (deleteError) {
        if (deleteError.message?.includes('not authorized') || deleteError.message?.includes('Invalid JWT')) {
          throw new Error(
            'Access denied: You do not have permission to delete files from private storage. Please ensure your credentials have delete access to the bucket.'
          );
        }
        throw new Error(`Failed to delete files: ${deleteError.message}`);
      }

      // Remove from local state
      const deletedIds = new Set(filteredCOAs.map(coa => coa.id));
      setCOAFiles(prev => prev.filter(file => !deletedIds.has(file.id)));
      
      // Clear selected COAs
      setSelectedCOAs(new Set());
      
      // Show success message
      alert(`Successfully deleted ${filteredCOAs.length} COA(s)`);

    } catch (err) {
      console.error('Error deleting COAs:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete COAs');
    } finally {
      setLoading(false);
    }
  };

  // Selection handlers
  const handleSelectCOA = (coaId: string) => {
    setSelectedCOAs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(coaId)) {
        newSet.delete(coaId);
      } else {
        newSet.add(coaId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCOAs.size === filteredCOAs.length) {
      // If all are selected, deselect all
      setSelectedCOAs(new Set());
    } else {
      // Select all filtered COAs
      setSelectedCOAs(new Set(filteredCOAs.map(coa => coa.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedCOAs(new Set());
  };

  // Export handlers
  const handleExportSelected = async () => {
    if (selectedCOAs.size === 0) {
      alert('Please select at least one COA to export.');
      return;
    }

    try {
      setExporting(true);

      const zip = new JSZip();
      const selectedCOAObjects = coaFiles.filter(coa => selectedCOAs.has(coa.id));

      // Download each selected COA and add to zip
      for (const coa of selectedCOAObjects) {
        try {
          // Construct the correct file path based on how files are stored
          let filePath: string;
          if (coa.clientFolder && coa.clientFolder !== 'Uncategorized' && coa.clientFolder !== 'Legacy Files') {
            filePath = `pdfs/${coa.clientFolder}/${coa.name}`;
          } else {
            filePath = `pdfs/${coa.name}`;
          }

          console.log('Downloading file from path:', filePath);

          const { data, error } = await supabase.storage
            .from('coas')
            .download(filePath);

          if (error) {
            console.error(`Error downloading ${coa.name}:`, error);
            continue;
          }

          if (data) {
            // Organize files in zip by client folder
            const zipPath = coa.clientFolder && coa.clientFolder !== 'Uncategorized' && coa.clientFolder !== 'Legacy Files'
              ? `${coa.clientFolder}/${coa.name}` 
              : `Legacy/${coa.name}`;
            zip.file(zipPath, data);
          }
        } catch (err) {
          console.error(`Error processing ${coa.name}:`, err);
        }
      }

      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `coas-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Successfully exported ${selectedCOAs.size} COA(s) to zip file.`);
    } catch (err) {
      console.error('Error exporting COAs:', err);
      alert('Failed to export COAs. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Render loading state on server and initial client render
  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-10 bg-neutral-700 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-neutral-700 rounded w-3/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-neutral-800 rounded-xl shadow-lg p-6">
                  <div className="h-40 bg-neutral-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/50 text-red-200 rounded-lg whitespace-pre-line border border-red-700/50">
            {error}
          </div>
        )}

        {/* VSCode-Style Toolbar */}
        <div className="mb-8 bg-neutral-800/90 backdrop-blur-sm border border-neutral-700 rounded-lg shadow-lg">
          <div className="flex flex-wrap items-center gap-2 p-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 pl-8 bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
              <svg
                className="absolute left-2.5 top-2 h-4 w-4 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-neutral-700"></div>

            {/* Client Filter */}
            <select
              id="clientFilter"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-neutral-100 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Clients ({coaFiles.length})</option>
              {clientFolders.map(folder => {
                const count = coaFiles.filter(coa => coa.clientFolder === folder).length;
                return (
                  <option key={folder} value={folder}>
                    {folder.replace(/_/g, ' ')} ({count})
                  </option>
                );
              })}
            </select>

            {/* Divider */}
            {filteredCOAs.length > 0 && <div className="h-6 w-px bg-neutral-700"></div>}

            {/* Action Buttons */}
            {filteredCOAs.length > 0 && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 bg-neutral-700 text-neutral-200 rounded hover:bg-neutral-600 transition-colors text-sm font-medium flex items-center gap-1.5"
                  title={selectedCOAs.size === filteredCOAs.length ? 'Deselect All' : 'Select All'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedCOAs.size === filteredCOAs.length ? 'Deselect' : 'Select All'}
                </button>

                {selectedCOAs.size > 0 && (
                  <>
                    <button
                      onClick={handleExportSelected}
                      disabled={exporting}
                      className="px-3 py-1.5 bg-neutral-700 text-neutral-200 rounded hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1.5"
                      title={`Export ${selectedCOAs.size} COA${selectedCOAs.size !== 1 ? 's' : ''}`}
                    >
                      {exporting ? (
                        <div className="w-4 h-4 border-2 border-neutral-200 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      Export ({selectedCOAs.size})
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className="px-3 py-1.5 bg-neutral-700 text-neutral-200 rounded hover:bg-neutral-600 transition-colors text-sm font-medium flex items-center gap-1.5"
                      title="Clear Selection"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  </>
                )}

                {/* Divider */}
                <div className="h-6 w-px bg-neutral-700"></div>

                <button
                  onClick={handleDeleteAll}
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600/90 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1.5"
                  title={`Delete All${searchTerm ? ` (${filteredCOAs.length})` : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All{searchTerm && ` (${filteredCOAs.length})`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedCOAs.size > 0 && (
          <div className="mb-6 bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-neutral-300 font-medium">
                  {selectedCOAs.size} COA{selectedCOAs.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-medium"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* No COAs State */}
        {!loading && !error && filteredCOAs.length === 0 && (
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-2xl shadow-xl p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-neutral-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              {searchTerm ? 'No COAs found matching your search' : 'No COAs uploaded yet'}
            </h3>
            <p className="text-neutral-400">
              {searchTerm ? 'Try a different search term' : 'Upload COAs from the main page to see them here'}
            </p>
          </div>
        )}

        {/* COA Grid */}
        {!loading && !error && filteredCOAs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCOAs.map((coa) => (
              <div
                key={coa.id}
                onClick={() => handleSelectCOA(coa.id)}
                className={`group cursor-pointer rounded-lg shadow-2xl transition-all duration-500 overflow-hidden border-2 ${
                  selectedCOAs.has(coa.id) 
                    ? 'bg-neutral-700/50 border-neutral-400 shadow-neutral-700/50 backdrop-blur-sm' 
                    : 'bg-neutral-900/90 border-neutral-800 backdrop-blur-sm hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col p-5 relative min-h-full">
                  {/* Selection Indicator */}
                  {selectedCOAs.has(coa.id) && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-neutral-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Logo Placeholder */}
                  <div className="flex-shrink-0 mb-4 flex items-center justify-center py-6 mt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/quantixlogo.png" 
                      alt="COA Document"
                      className={`w-24 h-24 object-contain grayscale transition-all duration-500 ${
                        selectedCOAs.has(coa.id) ? 'opacity-50' : 'opacity-30'
                      }`}
                      loading="lazy"
                    />
                  </div>

                  {/* File Name */}
                  <div className="flex-1 mb-4">
                    <div className="mb-2">
                      <span className="text-xs text-neutral-500 uppercase tracking-wider">
                        {coa.clientFolder?.replace(/_/g, ' ') || 'Uncategorized'}
                      </span>
                    </div>
                    <h3 className={`text-sm font-medium truncate mb-2 leading-tight transition-colors duration-300 ${
                      selectedCOAs.has(coa.id) ? 'text-neutral-200' : 'text-neutral-300'
                    }`}>
                      {coa.strainName || coa.name.replace('.pdf', '')}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-tight">
                      {formatDate(coa.created_at)}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className={`space-y-1.5 mb-4 pb-4 border-t pt-3 transition-colors duration-300 ${
                    selectedCOAs.has(coa.id) ? 'border-neutral-600' : 'border-neutral-800'
                  }`}>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Size</span>
                      <span className="text-neutral-400">{formatFileSize(coa.metadata?.size)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Path</span>
                      <span className="text-neutral-400 font-mono truncate ml-2 text-[10px]">
                        {coa.clientFolder === 'Legacy Files' ? coa.name : `${coa.clientFolder}/${coa.strainName}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCOA(coa);
                      }}
                      className="w-full px-3 py-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-700 hover:bg-neutral-700 hover:text-neutral-100 transition-all duration-300 font-medium text-xs"
                    >
                      View Document
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(coa.viewerUrl);
                        }}
                        className="flex-1 px-3 py-2 bg-neutral-900 text-neutral-400 rounded border border-neutral-800 hover:border-neutral-700 hover:text-neutral-300 transition-all duration-300 font-medium text-xs"
                      >
                        Copy
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCOA(coa);
                        }}
                        disabled={deletingFiles.has(coa.id)}
                        className="flex-1 px-3 py-2 bg-neutral-900 text-neutral-400 rounded border border-neutral-800 hover:border-red-900 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-xs flex items-center justify-center"
                      >
                        {deletingFiles.has(coa.id) ? (
                          <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && filteredCOAs.length > 0 && (
          <div className="mt-8 bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-lg shadow-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-neutral-400">
              <div className="space-y-1">
                <div>
                  Showing {filteredCOAs.length} of {coaFiles.length} COAs
                  {searchTerm && ` matching "${searchTerm}"`}
                  {selectedCOAs.size > 0 && ` • ${selectedCOAs.size} selected`}
                </div>
                {selectedClient !== 'all' && (
                  <div className="text-xs text-neutral-500">
                    Filtered by: {selectedClient.replace(/_/g, ' ')}
                  </div>
                )}
                <div className="text-xs text-neutral-500">
                  {clientFolders.length} client folder{clientFolders.length !== 1 ? 's' : ''} total
                </div>
              </div>
              <span className="text-xs bg-neutral-900/80 text-neutral-400 px-3 py-1 rounded border border-neutral-700 whitespace-nowrap">
                Private Storage • Served via www.quantixanalytics.com
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
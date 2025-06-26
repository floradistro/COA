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

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch COA files from Supabase storage
  const fetchCOAFiles = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: files, error: listError } = await supabase.storage
        .from('coas')
        .list('pdfs', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        if (listError.message?.includes('not authorized') || listError.message?.includes('Invalid JWT')) {
          throw new Error(
            'Access denied to private storage. Please ensure:\n' +
            '1. You are properly authenticated\n' +
            '2. Your credentials have read access to the bucket\n' +
            '3. RLS policies allow listing files'
          );
        }
        throw listError;
      }

      if (!files) {
        setCOAFiles([]);
        return;
      }

      const coaFiles: COAFile[] = files
        .filter(file => file.name.endsWith('.pdf'))
        .map(file => {
          const cleanFilename = file.name.replace('.pdf', '');
          return {
            id: file.id || file.name,
            name: file.name,
            created_at: file.created_at || new Date().toISOString(),
            updated_at: file.updated_at || new Date().toISOString(),
            metadata: file.metadata,
            viewerUrl: `https://www.quantixanalytics.com/coa/${cleanFilename}`
          };
        });

      setCOAFiles(coaFiles);
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

  const filteredCOAs = coaFiles.filter(coa =>
    coa.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      const filePath = `pdfs/${coa.name}`;
      const { error: deleteError } = await supabase.storage
        .from('coas')
        .remove([filePath]);

      if (deleteError) {
        if (deleteError.message?.includes('not authorized') || deleteError.message?.includes('Invalid JWT')) {
          throw new Error(
            'Access denied: You do not have permission to delete files from private storage. Please ensure your credentials have delete access to the bucket.'
          );
        }
        throw new Error(`Failed to delete file: ${deleteError.message}`);
      }

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

      const filePaths = filteredCOAs.map(coa => `pdfs/${coa.name}`);
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
          const filePath = `pdfs/${coa.name}`;
          const { data, error } = await supabase.storage
            .from('coas')
            .download(filePath);

          if (error) {
            console.error(`Error downloading ${coa.name}:`, error);
            continue;
          }

          if (data) {
            zip.file(coa.name, data);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="h-40 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'Lobster, cursive' }}>
              WhaleTools
            </h1>
            <span className="text-2xl text-gray-400">•</span>
            <h2 className="text-3xl font-bold text-gray-900">Live COAs</h2>
          </div>
          <p className="text-lg text-gray-600">
            View and manage all uploaded Certificates of Analysis. These COAs are accessible via www.quantixanalytics.com.
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg whitespace-pre-line">
              {error}
            </div>
          )}
        </div>

        {/* Search Bar and Bulk Actions */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search COAs
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by filename..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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
          </div>
          
          {/* Bulk Action Buttons */}
          <div className="flex gap-2">
            {filteredCOAs.length > 0 && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                >
                  {selectedCOAs.size === filteredCOAs.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedCOAs.size > 0 && (
                  <>
                    <button
                      onClick={handleExportSelected}
                      disabled={exporting}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      {exporting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      Export {selectedCOAs.size} COA{selectedCOAs.size !== 1 ? 's' : ''}
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                    >
                      Clear Selection
                    </button>
                  </>
                )}
                <button
                  onClick={handleDeleteAll}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All {searchTerm && `(${filteredCOAs.length})`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedCOAs.size > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-800 font-medium">
                  {selectedCOAs.size} COA{selectedCOAs.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No COAs found matching your search' : 'No COAs uploaded yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try a different search term' : 'Upload COAs from the main page to see them here'}
            </p>
          </div>
        )}

        {/* COA Grid */}
        {!loading && !error && filteredCOAs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCOAs.map((coa) => (
              <div
                key={coa.id}
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
                  selectedCOAs.has(coa.id) ? 'border-blue-500 shadow-blue-100' : 'border-transparent'
                }`}
              >
                <div className="p-6">
                  {/* Selection Checkbox */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedCOAs.has(coa.id)}
                        onChange={() => handleSelectCOA(coa.id)}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      {selectedCOAs.has(coa.id) && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Icon and Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {coa.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(coa.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>{formatFileSize(coa.metadata?.size)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="truncate font-mono text-xs">
                        {coa.viewerUrl.replace('https://www.quantixanalytics.com/coa/', '')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewCOA(coa)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      View COA
                    </button>
                    <button
                      onClick={() => handleCopyLink(coa.viewerUrl)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => handleDeleteCOA(coa)}
                      disabled={deletingFiles.has(coa.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center"
                    >
                      {deletingFiles.has(coa.id) ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && filteredCOAs.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredCOAs.length} of {coaFiles.length} COAs
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCOAs.size > 0 && ` • ${selectedCOAs.size} selected`}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Private Storage • Served via www.quantixanalytics.com
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
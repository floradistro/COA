'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { COAData } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProgressBar from '@/components/ProgressBar';
import { useNotifications } from '@/components/NotificationSystem';
import PDFPreview from '@/components/PDFPreview';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface LiveCOA {
  id: string;
  name: string;
  created_at: string;
  public_url: string;
  metadata?: COAData;
}

// Use the same Supabase URL as in the client
const SUPABASE_URL = 'https://elhsobjvwmjfminxxcwy.supabase.co';

export default function LiveCOAsPage() {
  const [liveCOAs, setLiveCOAs] = useState<LiveCOA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCOA, setSelectedCOA] = useState<LiveCOA | null>(null);
  const [selectedCOAs, setSelectedCOAs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  
  const { showNotification } = useNotifications();
  const hiddenIframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch live COAs from Supabase
  const fetchLiveCOAs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .storage
        .from('coas')
        .list('pdfs', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // Filter out system files and empty placeholders
      const validFiles = (data || []).filter(file => 
        file.name && 
        file.name.toLowerCase().endsWith('.pdf') &&
        !file.name.toLowerCase().includes('placeholder') &&
        !file.name.toLowerCase().includes('empty') &&
        !file.name.startsWith('.') &&
        file.name.trim() !== ''
      );

      const coas: LiveCOA[] = validFiles.map(file => ({
        id: file.id,
        name: file.name,
        created_at: file.created_at,
        public_url: `${SUPABASE_URL}/storage/v1/object/public/coas/pdfs/${file.name}`,
        metadata: file.metadata as COAData
      }));

      setLiveCOAs(coas);
    } catch (error) {
      console.error('Error fetching COAs:', error);
      setError('Failed to fetch live COAs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveCOAs();
  }, [fetchLiveCOAs]);

  const handleSelectCOA = (coaId: string) => {
    const newSelected = new Set(selectedCOAs);
    if (newSelected.has(coaId)) {
      newSelected.delete(coaId);
    } else {
      newSelected.add(coaId);
    }
    setSelectedCOAs(newSelected);
    setSelectAll(newSelected.size === liveCOAs.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCOAs(new Set());
      setSelectAll(false);
    } else {
      setSelectedCOAs(new Set(liveCOAs.map(coa => coa.id)));
      setSelectAll(true);
    }
  };

  const handleDelete = async (coa: LiveCOA) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${coa.name}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .storage
        .from('coas')
        .remove([`pdfs/${coa.name}`]);

      if (error) throw error;

      showNotification('success', 'COA deleted successfully');
      fetchLiveCOAs();
      // Remove from selection if it was selected
      const newSelected = new Set(selectedCOAs);
      newSelected.delete(coa.id);
      setSelectedCOAs(newSelected);
    } catch (error) {
      console.error('Error deleting COA:', error);
      showNotification('error', 'Failed to delete COA');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCOAs.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedCOAs.size} selected COA(s)?`);
    if (!confirmed) return;

    try {
      const selectedCOAsList = liveCOAs.filter(coa => selectedCOAs.has(coa.id));
      const filePaths = selectedCOAsList.map(coa => `pdfs/${coa.name}`);
      
      const { error } = await supabase
        .storage
        .from('coas')
        .remove(filePaths);

      if (error) throw error;

      showNotification('success', `${selectedCOAs.size} COAs deleted successfully`);
      setSelectedCOAs(new Set());
      setSelectAll(false);
      fetchLiveCOAs();
    } catch (error) {
      console.error('Error deleting COAs:', error);
      showNotification('error', 'Failed to delete selected COAs');
    }
  };

  const handleDownload = async (coa: LiveCOA) => {
    try {
      const response = await fetch(coa.public_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = coa.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification('success', 'COA downloaded successfully');
    } catch (error) {
      console.error('Error downloading COA:', error);
      showNotification('error', 'Failed to download COA');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedCOAs.size === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const selectedCOAsList = liveCOAs.filter(coa => selectedCOAs.has(coa.id));
      const total = selectedCOAsList.length;
      
      for (let i = 0; i < selectedCOAsList.length; i++) {
        const coa = selectedCOAsList[i];
        await handleDownload(coa);
        setExportProgress(((i + 1) / total) * 100);
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      showNotification('success', `${selectedCOAs.size} COAs downloaded successfully`);
    } catch (error) {
      console.error('Error downloading COAs:', error);
      showNotification('error', 'Failed to download selected COAs');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleBulkZipDownload = async () => {
    if (selectedCOAs.size === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const selectedCOAsList = liveCOAs.filter(coa => selectedCOAs.has(coa.id));
      const total = selectedCOAsList.length;
      const zip = new JSZip();
      
      for (let i = 0; i < selectedCOAsList.length; i++) {
        const coa = selectedCOAsList[i];
        try {
          const response = await fetch(coa.public_url);
          const blob = await response.blob();
          const cleanName = coa.name.replace(/^\d+_/, '');
          zip.file(cleanName, blob);
          setExportProgress(((i + 1) / total) * 100);
        } catch (error) {
          console.error(`Error adding ${coa.name} to zip:`, error);
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(zipBlob, `COAs_Export_${timestamp}.zip`);
      
      showNotification('success', `${selectedCOAs.size} COAs exported as ZIP file`);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      showNotification('error', 'Failed to create ZIP file');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handlePrint = (coa: LiveCOA) => {
    const printWindow = window.open(coa.public_url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleBulkPrint = async () => {
    if (selectedCOAs.size === 0) return;

    const selectedCOAsList = liveCOAs.filter(coa => selectedCOAs.has(coa.id));
    
    try {
      for (const coa of selectedCOAsList) {
        const printWindow = window.open(coa.public_url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        // Small delay between print jobs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      showNotification('success', `${selectedCOAs.size} COAs sent to printer`);
    } catch (error) {
      console.error('Error printing COAs:', error);
      showNotification('error', 'Failed to print selected COAs');
    }
  };

  const selectedCount = selectedCOAs.size;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md mx-auto">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading COAs</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLiveCOAs}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Live COAs
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                Export and manage your official Certificate of Analysis documents
              </p>
            </div>
            <button
              onClick={fetchLiveCOAs}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {liveCOAs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Select All ({liveCOAs.length})
                </label>
                {selectedCount > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedCount} COA{selectedCount !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              
              {selectedCount > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBulkDownload}
                    disabled={isExporting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export {selectedCount} (Individual)
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBulkZipDownload}
                    disabled={isExporting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        Creating ZIP...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Export as ZIP ({selectedCount})
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleBulkPrint}
                    disabled={isExporting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print {selectedCount}
                  </button>
                  
                  <button
                    onClick={handleBulkDelete}
                    disabled={isExporting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete {selectedCount}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export Progress */}
        {isExporting && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-8">
            <ProgressBar
              progress={exportProgress}
              label="Exporting COAs..."
              color="green"
              height="md"
            />
          </div>
        )}

        {/* COA Grid */}
        {liveCOAs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Live COAs</h3>
            <p className="text-gray-600">Launch COAs from the generator to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveCOAs.map((coa) => (
              <div
                key={coa.id}
                className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden ${
                  selectedCOAs.has(coa.id) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedCOAs.has(coa.id)}
                    onChange={() => handleSelectCOA(coa.id)}
                    className="w-5 h-5 text-blue-600 border-2 border-white shadow-lg rounded focus:ring-blue-500"
                  />
                </div>

                {/* Preview */}
                <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 relative group cursor-pointer overflow-hidden rounded-t-xl border-b border-gray-100"
                     onClick={() => setSelectedCOA(coa)}>
                  <PDFPreview 
                    url={coa.public_url}
                    className="w-full h-full p-2"
                    fallback={
                      <div className="flex flex-col items-center justify-center h-full p-4">
                        <div className="bg-white rounded-2xl shadow-lg p-4 mb-3 group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                            {coa.name.replace(/^\d+_/, '').replace('.pdf', '')}
                          </p>
                          <p className="text-xs text-gray-500">PDF Document</p>
                        </div>
                      </div>
                    }
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                      <span className="text-gray-800 font-medium text-sm">View Full COA</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {coa.name.replace(/^\d+_/, '').replace('.pdf', '')}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {new Date(coa.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  {/* Individual Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(coa)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => handlePrint(coa)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Print
                    </button>
                    <button
                      onClick={() => handleDelete(coa)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COA Viewer Modal */}
        {selectedCOA && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
               onClick={() => setSelectedCOA(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCOA.name.replace(/^\d+_/, '').replace('.pdf', '')}
                </h2>
                <button
                  onClick={() => setSelectedCOA(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-auto" style={{ height: 'calc(90vh - 200px)' }}>
                <iframe
                  src={selectedCOA.public_url}
                  className="w-full h-full rounded-lg"
                  title={selectedCOA.name}
                />
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-4">
                <button
                  onClick={() => handleDownload(selectedCOA)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => handlePrint(selectedCOA)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Print
                </button>
                <button
                  onClick={() => window.open(selectedCOA.public_url, '_blank')}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden iframe for printing */}
        <iframe
          ref={hiddenIframeRef}
          style={{ display: 'none' }}
          title="Print COA"
        />
      </div>
    </div>
  );
} 
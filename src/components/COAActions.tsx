import React from 'react';
import { COAData } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';
import { useRouter } from 'next/navigation';

interface COAActionsProps {
  isPreview: boolean;
  setIsPreview: (preview: boolean) => void;
  onPrint?: () => void;
  onExportPDF?: () => void;
  onExportAllCOAs?: () => void;
  onBurnBatch?: () => void;
  onPushToLab?: () => void;
  onUploadToSupabase?: () => void;
  onUploadAllToSupabase?: () => void;
  onGenerateQRCode?: () => void;
  onSyncQRCode?: () => void;
  onRefreshAllQRCodes?: () => void;
  isMultiStrain: boolean;
  generatedCOAs: COAData[];
  currentCOAIndex: number;
  onNavigateCOA: (index: number) => void;
  isExporting?: boolean;
  exportProgress?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  hasUploadedCOAs?: boolean;
}

export const COAActions: React.FC<COAActionsProps> = ({
  isPreview,
  setIsPreview,
  onPrint,
  onExportPDF,
  onExportAllCOAs,
  onBurnBatch,
  onPushToLab,
  onUploadToSupabase,
  onUploadAllToSupabase,
  onGenerateQRCode,
  onSyncQRCode,
  onRefreshAllQRCodes,
  isMultiStrain,
  generatedCOAs,
  currentCOAIndex,
  onNavigateCOA,
  isExporting,
  exportProgress,
  isUploading = false,
  uploadProgress = 0,
  hasUploadedCOAs = false
}) => {
  const router = useRouter();
  const currentCOA = generatedCOAs[currentCOAIndex];
  const isCurrentCOALaunched = currentCOA?.publicUrl ? true : false;

  return (
    <div className="mb-8 space-y-4">
      {/* Export Progress */}
      {isExporting && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <ProgressBar
            progress={exportProgress || 0}
            label="Exporting COAs..."
            color="blue"
            height="md"
          />
        </div>
      )}
      
      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <ProgressBar
            progress={uploadProgress}
            label="Launching COAs to cloud..."
            color="indigo"
            height="md"
          />
        </div>
      )}
      
      {/* Navigation for multiple COAs */}
      {isMultiStrain && generatedCOAs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateCOA(currentCOAIndex - 1)}
                disabled={currentCOAIndex === 0}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700">
                COA {currentCOAIndex + 1} of {generatedCOAs.length}
              </span>
              <button
                onClick={() => onNavigateCOA(currentCOAIndex + 1)}
                disabled={currentCOAIndex === generatedCOAs.length - 1}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {generatedCOAs[currentCOAIndex]?.strain || 'Unknown Strain'}
              </div>
              <div className="flex items-center gap-2">
                {/* QR Code Status Indicator */}
                {generatedCOAs[currentCOAIndex]?.qrCodeDataUrl ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR Code
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    No QR
                  </span>
                )}
                
                {/* Launch Status Indicator */}
                {generatedCOAs[currentCOAIndex]?.publicUrl ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Launched
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Draft
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setIsPreview(!isPreview)}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
        >
          {isPreview ? 'Edit COA' : 'Preview COA'}
        </button>

        {/* View Live COAs Button */}
        <button
          onClick={() => router.push('/live-coas')}
          className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          View Live COAs
        </button>

        {/* Generate QR Code Button */}
        {onGenerateQRCode && !isCurrentCOALaunched && (
          <button
            onClick={onGenerateQRCode}
            disabled={isExporting || isUploading}
            className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Generate QR Code
              </>
            )}
          </button>
        )}
        
        {onPrint && (
          <button
            onClick={onPrint}
            disabled={isExporting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Printing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print COA
              </>
            )}
          </button>
        )}
        
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            disabled={isExporting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </>
            )}
          </button>
        )}
        
        {onExportAllCOAs && (
          <button
            onClick={onExportAllCOAs}
            disabled={isExporting}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Exporting All...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export All COAs
              </>
            )}
          </button>
        )}

        {/* BURN Button */}
        {onBurnBatch && (
          <button
            onClick={onBurnBatch}
            disabled={isExporting}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Burning...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                BURN SESSION
              </>
            )}
          </button>
        )}

        {/* LAUNCH COA Button - replaces Upload to Supabase */}
        {onUploadToSupabase && !isCurrentCOALaunched && (
          <button
            onClick={onUploadToSupabase}
            disabled={isExporting || isUploading}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg font-medium flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Launching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Launch COA
              </>
            )}
          </button>
        )}

        {/* View Live COA Button - shows when current COA is launched */}
        {isCurrentCOALaunched && currentCOA?.publicUrl && (
          <button
            onClick={() => window.open(currentCOA.publicUrl, '_blank')}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Live COA
          </button>
        )}

        {/* LAUNCH ALL COAs Button */}
        {onUploadAllToSupabase && generatedCOAs.length > 1 && (
          <button
            onClick={onUploadAllToSupabase}
            disabled={isExporting || isUploading}
            className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Launching All...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                </svg>
                Launch All COAs
              </>
            )}
          </button>
        )}

        {/* PUSH TO LAB Button */}
        {onPushToLab && generatedCOAs.length > 0 && (
          <button
            onClick={onPushToLab}
            disabled={isExporting || isUploading}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isExporting || isUploading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Pushing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                PUSH TO LAB
              </>
            )}
          </button>
        )}

        {/* Sync QR Code Button */}
        {onSyncQRCode && isCurrentCOALaunched && (
          <button
            onClick={onSyncQRCode}
            disabled={isExporting || isUploading}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isExporting || isUploading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L15.232 5.232z" />
                </svg>
                Sync QR Code
              </>
            )}
          </button>
        )}

        {/* Refresh All QR Codes Button */}
        {onRefreshAllQRCodes && hasUploadedCOAs && (
          <button
            onClick={onRefreshAllQRCodes}
            disabled={isExporting || isUploading}
            className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isExporting || isUploading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.355-2a8.001 8.001 0 0015.355 2m0 0H15m1-11h.008" />
                </svg>
                Refresh All QR Codes
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Launch Status Information */}
      {isCurrentCOALaunched && (
        <div className="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-purple-900 mb-1">COA Successfully Launched!</h4>
              <div className="text-sm text-purple-800">
                <p className="mb-2">This COA is now live and official. You can:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>View Live COA:</strong> Open the official COA in your browser</li>
                  <li><strong>Export PDF:</strong> Download a local copy with the QR code</li>
                  <li><strong>Sync QR Code:</strong> Update the preview with the live QR code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Status Information */}
      {!isCurrentCOALaunched && generatedCOAs.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-900 mb-1">Draft COA</h4>
              <div className="text-sm text-yellow-800">
                <p>This COA is not official until launched. Click &quot;Launch COA&quot; to make it live.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
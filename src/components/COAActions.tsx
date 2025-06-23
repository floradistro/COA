import React from 'react';
import { COAData } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';

interface COAActionsProps {
  isPreview: boolean;
  setIsPreview: (preview: boolean) => void;
  onPrint: () => void;
  onExportPDF: () => void;
  onExportAllCOAs?: () => void;
  onBurnBatch?: () => void;
  onPushToLab?: () => void;
  isMultiStrain: boolean;
  generatedCOAs: COAData[];
  currentCOAIndex: number;
  onNavigateCOA: (index: number) => void;
  isExporting: boolean;
  exportProgress: number;
}

export const COAActions: React.FC<COAActionsProps> = ({
  isPreview,
  setIsPreview,
  onPrint,
  onExportPDF,
  onExportAllCOAs,
  onBurnBatch,
  onPushToLab,
  isMultiStrain,
  generatedCOAs,
  currentCOAIndex,
  onNavigateCOA,
  isExporting,
  exportProgress
}) => {
  return (
    <div className="mb-8 space-y-4">
      {/* Export Progress */}
      {isExporting && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <ProgressBar
            progress={exportProgress}
            label="Exporting COAs..."
            color="blue"
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
            <div className="text-sm text-gray-600">
              {generatedCOAs[currentCOAIndex]?.strain || 'Unknown Strain'}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                BURN SESSION
              </>
            )}
          </button>
        )}

        {/* PUSH TO LAB Button */}
        {onPushToLab && generatedCOAs.length > 0 && (
          <button
            onClick={onPushToLab}
            disabled={isExporting}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isExporting ? (
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
      </div>
    </div>
  );
}; 
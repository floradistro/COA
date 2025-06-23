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
      </div>
    </div>
  );
}; 
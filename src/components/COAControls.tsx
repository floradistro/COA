import React from 'react';
import { ProductType, CannabinoidProfile, COAData } from '@/types';
import { PRODUCT_CONFIGS } from '@/constants/defaults';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';
import { useRouter } from 'next/navigation';

interface COAControlsProps {
  strain: string;
  setStrain: (strain: string) => void;
  dateReceived: string;
  setDateReceived: (date: string) => void;
  productType: ProductType;
  setProductType: (type: ProductType) => void;
  selectedProfile: CannabinoidProfile;
  setSelectedProfile: (profile: CannabinoidProfile) => void;
  isMultiStrain: boolean;
  setIsMultiStrain: (multi: boolean) => void;
  strainList: string;
  setStrainList: (list: string) => void;
  onGenerate: () => void;
  onGenerateBatch: () => void;
  isGeneratingBatch: boolean;
  // Action button props
  isPreview: boolean;
  setIsPreview: (preview: boolean) => void;
  onBurnBatch?: () => void;
  onUploadToSupabase?: () => void;
  onUploadAllToSupabase?: () => void;
  generatedCOAs: COAData[];
  currentCOAIndex: number;
  isExporting?: boolean;
  exportProgress?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const COAControls: React.FC<COAControlsProps> = ({
  strain,
  setStrain,
  dateReceived,
  setDateReceived,
  productType,
  setProductType,
  selectedProfile,
  setSelectedProfile,
  isMultiStrain,
  setIsMultiStrain,
  strainList,
  setStrainList,
  onGenerate,
  onGenerateBatch,
  isGeneratingBatch,
  // Action props
  isPreview,
  setIsPreview,
  onBurnBatch,
  onUploadToSupabase,
  onUploadAllToSupabase,
  generatedCOAs,
  currentCOAIndex,
  isExporting,
  exportProgress,
  isUploading = false,
  uploadProgress = 0
}) => {
  const router = useRouter();
  const currentCOA = generatedCOAs[currentCOAIndex];
  const isCurrentCOALaunched = currentCOA?.publicUrl ? true : false;

  return (
    <div className="mb-6 space-y-4">
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

      {/* Single/Multi Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
        <button
          onClick={() => setIsMultiStrain(false)}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
            !isMultiStrain 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Single Strain
        </button>
        <button
          onClick={() => setIsMultiStrain(true)}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
            isMultiStrain 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Multi-Strain Batch
        </button>
      </div>

      {/* Controls Container */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {/* Main Controls */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Strain Input */}
            <div className={isMultiStrain ? 'md:col-span-4' : ''}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isMultiStrain ? 'Strain Names (one per line)' : 'Strain Name'}
              </label>
              {isMultiStrain ? (
                <textarea
                  value={strainList}
                  onChange={(e) => setStrainList(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all h-20 text-sm"
                  placeholder="Enter strain names, one per line..."
                />
              ) : (
                <input
                  type="text"
                  value={strain}
                  onChange={(e) => setStrain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 text-sm"
                  placeholder="Enter strain name..."
                />
              )}
            </div>

            {/* Date Received */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date Received
              </label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 text-sm"
              />
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm"
              >
                {Object.entries(PRODUCT_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.sampleType}
                  </option>
                ))}
              </select>
            </div>

            {/* Cannabinoid Profile */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cannabinoid Profile
              </label>
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value as CannabinoidProfile)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm"
              >
                <option value="high-thc">High THCA (22-30%)</option>
                <option value="medium-thc">Medium THCA (15-20%)</option>
                <option value="low-thc">Low THCA (0-15%)</option>
                <option value="hemp">Hemp/CBD (0.1-0.3% THCA)</option>
                <option value="decarbed">Decarbed (1-5% THCA)</option>
              </select>
            </div>
          </div>

          {/* Generate Button and Action Buttons Row */}
          <div className="mt-4 space-y-3">
            {/* Generate Button */}
            <div className="w-full">
              {isMultiStrain ? (
                <button
                  onClick={onGenerateBatch}
                  disabled={isGeneratingBatch || !strainList.trim()}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  {isGeneratingBatch ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Batch...
                    </span>
                  ) : (
                    'Generate Batch COAs'
                  )}
                </button>
              ) : (
                <button
                  onClick={onGenerate}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-md font-medium text-sm"
                >
                  Generate COA
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="w-full px-4 py-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
              >
                {isPreview ? 'Edit COA' : 'Preview COA'}
              </button>

              <button
                onClick={() => router.push('/live-coas')}
                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                View Live COAs
              </button>

              {/* Launch COA/Launch All Button */}
              {isMultiStrain && generatedCOAs.length > 1 && onUploadAllToSupabase ? (
                <button
                  onClick={onUploadAllToSupabase}
                  disabled={isExporting || isUploading}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-md hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium text-sm flex items-center justify-center gap-1"
                >
                  {isUploading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      Launching All...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                      </svg>
                      Launch All COAs
                    </>
                  )}
                </button>
              ) : onUploadToSupabase && !isCurrentCOALaunched && (
                <button
                  onClick={onUploadToSupabase}
                  disabled={isExporting || isUploading}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium text-sm flex items-center justify-center gap-1"
                >
                  {isUploading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Launch COA
                    </>
                  )}
                </button>
              )}

              {isCurrentCOALaunched && currentCOA?.publicUrl && (
                <button
                  onClick={() => window.open(currentCOA.publicUrl, '_blank')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-700 hover:to-emerald-700 transition-all shadow-md font-medium text-sm flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Live COA
                </button>
              )}

              {onBurnBatch && (
                <button
                  onClick={onBurnBatch}
                  disabled={isExporting}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  BURN SESSION
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
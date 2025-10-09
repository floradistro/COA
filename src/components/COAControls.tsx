import React from 'react';
import { ProductType, CannabinoidProfile, COAData } from '@/types';
import { PRODUCT_CONFIGS, LAB_EMPLOYEES, SAMPLE_SIZE_OPTIONS } from '@/constants/defaults';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';
import { useRouter } from 'next/navigation';

interface COAControlsProps {
  strain: string;
  setStrain: (strain: string) => void;
  dateReceived: string;
  setDateReceived: (date: string) => void;
  dateCollected: string;
  setDateCollected: (date: string) => void;
  dateTested: string;
  setDateTested: (date: string) => void;
  dateTestedEnd: string;
  setDateTestedEnd: (date: string) => void;
  productType: ProductType;
  setProductType: (type: ProductType) => void;
  selectedProfile: CannabinoidProfile;
  setSelectedProfile: (profile: CannabinoidProfile) => void;
  selectedLabEmployee: string;
  setSelectedLabEmployee: (employee: string) => void;
  sampleSize: string;
  setSampleSize: (size: string) => void;
  isMultiStrain: boolean;
  setIsMultiStrain: (multi: boolean) => void;
  strainList: string;
  setStrainList: (list: string) => void;
  // Edible specific props
  edibleDosage: number;
  setEdibleDosage: (dosage: number) => void;
  onGenerate: () => void;
  onGenerateBatch: () => void;
  isGeneratingBatch: boolean;
  // Action button props
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
  dateCollected,
  setDateCollected,
  dateTested,
  setDateTested,
  dateTestedEnd,
  setDateTestedEnd,
  productType,
  setProductType,
  selectedProfile,
  setSelectedProfile,
  selectedLabEmployee,
  setSelectedLabEmployee,
  sampleSize,
  setSampleSize,
  isMultiStrain,
  setIsMultiStrain,
  strainList,
  setStrainList,
  // Edible props
  edibleDosage,
  setEdibleDosage,
  onGenerate,
  onGenerateBatch,
  isGeneratingBatch,
  // Action props
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
    <>
      {/* Export Progress - Fixed at bottom */}
      {isExporting && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-md px-4 animate-slide-up">
          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] border border-blue-500/20">
            <div className="p-4">
              <ProgressBar
                progress={exportProgress || 0}
                label="Exporting COAs..."
                color="blue"
                height="md"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Progress - Fixed at bottom */}
      {isUploading && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-md px-4 animate-slide-up">
          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] border border-indigo-500/20">
            <div className="p-4">
              <ProgressBar
                progress={uploadProgress}
                label="Launching COAs to cloud..."
                color="indigo"
                height="md"
              />
            </div>
          </div>
        </div>
      )}

    <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
      {/* Controls Container */}
      <div className="bg-neutral-900/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.03)]">
        {/* Main Controls */}
        <div className="relative">
          {/* Subtle gradient line accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-500/30 to-transparent" />
          
          <div className="px-3 py-4 sm:px-6 sm:py-8 space-y-4 sm:space-y-6">
            {/* Strain Input */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  {productType === 'edible' ? 
                    (isMultiStrain ? 'Product Names (one per line)' : 'Product Name') : 
                    (isMultiStrain ? 'Strain Names (one per line)' : 'Strain Name')
                  }
                </label>
                
                {/* Compact Single/Bulk Toggle */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
                  <button
                    onClick={() => setIsMultiStrain(false)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                      !isMultiStrain 
                        ? 'bg-white/15 text-white shadow-sm' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setIsMultiStrain(true)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                      isMultiStrain 
                        ? 'bg-white/15 text-white shadow-sm' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Bulk
                  </button>
                </div>
              </div>
              
              {isMultiStrain ? (
                <textarea
                  value={strainList}
                  onChange={(e) => setStrainList(e.target.value)}
                  className="w-full px-5 py-4 bg-white/5 backdrop-blur-xl text-white placeholder-neutral-500 rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 h-28 text-base resize-none"
                  placeholder={productType === 'edible' ? 'Enter product names, one per line...' : 'Enter strain names, one per line...'}
                />
              ) : (
                <input
                  type="text"
                  value={strain}
                  onChange={(e) => setStrain(e.target.value)}
                  className="w-full px-5 py-4 bg-white/5 backdrop-blur-xl text-white placeholder-neutral-500 rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
                  placeholder={productType === 'edible' ? 'Enter product name...' : 'Enter strain name...'}
                />
              )}
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Date Collected */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Date Collected</label>
                <input
                  type="date"
                  value={dateCollected}
                  onChange={(e) => setDateCollected(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl text-white rounded-xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-sm"
                />
              </div>

              {/* Date Received */}
              <div>
                <label className="block text-[10px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Date Received</label>
                <input
                  type="date"
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl text-white rounded-xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-sm"
                />
              </div>

              {/* Date Completed Range */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Date Completed Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateTested}
                    onChange={(e) => setDateTested(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 backdrop-blur-xl text-white rounded-xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-sm"
                  />
                  <span className="text-neutral-400 text-xs font-medium">to</span>
                  <input
                    type="date"
                    value={dateTestedEnd}
                    onChange={(e) => setDateTestedEnd(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 backdrop-blur-xl text-white rounded-xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Product Type, Cannabinoid Profile, Sample Size, and Lab Employee */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Product Type */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">
                  Product Type
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as ProductType)}
                  className="w-full px-5 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
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
                <label className="block text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">
                  Cannabinoid Profile
                </label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value as CannabinoidProfile)}
                  className="w-full px-5 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
                >
                  <option value="high-thc">High THCA (22-30%)</option>
                  <option value="medium-thc">Medium THCA (15-20%)</option>
                  <option value="low-thc">Low THCA (0-15%)</option>
                  <option value="hemp">Hemp/CBD (0.1-0.3% THCA)</option>
                  <option value="decarbed">Decarbed (1-5% THCA)</option>
                </select>
              </div>

              {/* Sample Size */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">
                  Sample Size
                </label>
                <div className="flex gap-2">
                  <select
                    value={SAMPLE_SIZE_OPTIONS.find(option => option.value === sampleSize)?.value || 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        // Keep current value if it's not in the predefined options
                        const isPredefineOption = SAMPLE_SIZE_OPTIONS.some(option => option.value === sampleSize);
                        if (isPredefineOption) {
                          setSampleSize('');
                        }
                      } else {
                        setSampleSize(e.target.value);
                      }
                    }}
                    className="flex-1 px-5 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
                  >
                    {SAMPLE_SIZE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {(!SAMPLE_SIZE_OPTIONS.some(option => option.value === sampleSize) || 
                    SAMPLE_SIZE_OPTIONS.find(option => option.value === sampleSize)?.value === 'custom') && (
                    <input
                      type="text"
                      value={sampleSize}
                      onChange={(e) => setSampleSize(e.target.value)}
                      placeholder="Custom"
                      className="w-28 px-5 py-4 bg-white/5 backdrop-blur-xl text-white placeholder-neutral-500 rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
                    />
                  )}
                </div>
              </div>

              {/* Lab Employee */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">
                  Approved By
                </label>
                <select
                  value={selectedLabEmployee}
                  onChange={(e) => setSelectedLabEmployee(e.target.value)}
                  className="w-full px-5 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
                >
                  <option value="">Random Employee</option>
                  {LAB_EMPLOYEES.map((employee) => (
                    <option key={employee.name} value={employee.name}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Edible Specific Fields - Only show when edible is selected */}
              {productType === 'edible' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">
                      THC Content (mg)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={[2.5, 5, 10, 25, 50, 100].includes(edibleDosage) ? edibleDosage : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            // Keep current value if it's already custom
                            if (![2.5, 5, 10, 25, 50, 100].includes(edibleDosage)) {
                              // Already custom, don't change
                              return;
                            } else {
                              setEdibleDosage(0);
                            }
                          } else {
                            setEdibleDosage(Number(e.target.value));
                          }
                        }}
                        className="flex-1 px-5 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
                      >
                        <option value={2.5}>2.5mg</option>
                        <option value={5}>5mg</option>
                        <option value={10}>10mg</option>
                        <option value={25}>25mg</option>
                        <option value={50}>50mg</option>
                        <option value={100}>100mg</option>
                        <option value="custom">Custom</option>
                      </select>
                      {![2.5, 5, 10, 25, 50, 100].includes(edibleDosage) && (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={edibleDosage}
                          onChange={(e) => setEdibleDosage(Number(e.target.value))}
                          placeholder="mg"
                          className="w-28 px-5 py-4 bg-white/5 backdrop-blur-xl text-white placeholder-neutral-500 rounded-2xl focus:outline-none focus:bg-white/10 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button and Action Buttons Row - Floating Below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {/* Generate Button */}
        {isMultiStrain ? (
          <button
            onClick={onGenerateBatch}
            disabled={isGeneratingBatch || !strainList.trim()}
            className="w-full px-4 py-4 bg-gradient-to-r from-white/15 to-white/10 hover:from-white/20 hover:to-white/15 text-white font-semibold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_32px_0_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-[0.99] text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10"
          >
            {isGeneratingBatch ? (
              <>
                <svg className="animate-spin h-4 w-4 text-neutral-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onGenerate}
            className="w-full px-4 py-4 bg-gradient-to-r from-white/15 to-white/10 hover:from-white/20 hover:to-white/15 text-white font-semibold rounded-2xl transition-all duration-300 shadow-[0_8px_24px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_32px_0_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-[0.99] text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate
          </button>
        )}

        <button
          onClick={() => router.push('/live-coas')}
          className="w-full px-4 py-3 bg-transparent text-neutral-400 hover:text-white rounded-2xl hover:bg-white/5 transition-all duration-300 font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Library
        </button>

        {/* Launch COA/Launch All Button */}
        {isMultiStrain && generatedCOAs.length > 1 && onUploadAllToSupabase ? (
          <button
            onClick={onUploadAllToSupabase}
            disabled={isExporting || isUploading}
            className="w-full px-4 py-3 bg-transparent text-neutral-400 hover:text-white rounded-2xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Launching...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                </svg>
                Launch
              </>
            )}
          </button>
        ) : onUploadToSupabase && !isCurrentCOALaunched && (
          <button
            onClick={onUploadToSupabase}
            disabled={isExporting || isUploading}
            className="w-full px-4 py-3 bg-transparent text-neutral-400 hover:text-white rounded-2xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
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
                Launch
              </>
            )}
          </button>
        )}

        {isCurrentCOALaunched && currentCOA?.publicUrl && (
          <button
            onClick={() => window.open(currentCOA.publicUrl, '_blank')}
            className="w-full px-4 py-3 bg-transparent text-neutral-300 hover:text-white rounded-2xl hover:bg-white/5 transition-all duration-300 font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
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
            className="w-full px-4 py-3 bg-transparent text-neutral-400 hover:text-neutral-200 rounded-2xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Burn
          </button>
        )}
      </div>
    </div>
    </>
  );
}; 
import React from 'react';
import { ProductType, CannabinoidProfile } from '@/types';
import { PRODUCT_CONFIGS } from '@/constants/defaults';

interface COAControlsProps {
  strain: string;
  setStrain: (strain: string) => void;
  dateReceived: string;
  setDateReceived: (date: string) => void;
  productType: ProductType;
  setProductType: (type: ProductType) => void;
  selectedProfile: CannabinoidProfile;
  setSelectedProfile: (profile: CannabinoidProfile) => void;
  isTHCACompliance: boolean;
  setIsTHCACompliance: (compliance: boolean) => void;
  isMultiStrain: boolean;
  setIsMultiStrain: (multi: boolean) => void;
  strainList: string;
  setStrainList: (list: string) => void;
  onGenerate: () => void;
  onGenerateBatch: () => void;
  isGeneratingBatch: boolean;
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
  isTHCACompliance,
  setIsTHCACompliance,
  isMultiStrain,
  setIsMultiStrain,
  strainList,
  setStrainList,
  onGenerate,
  onGenerateBatch,
  isGeneratingBatch
}) => {
  return (
    <div className="mb-8 space-y-6">
      {/* Single/Multi Toggle */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setIsMultiStrain(false)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            !isMultiStrain 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Single Strain
        </button>
        <button
          onClick={() => setIsMultiStrain(true)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            isMultiStrain 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Multi-Strain Batch
        </button>
      </div>

      {/* Controls Container */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strain Input */}
          <div className={isMultiStrain ? 'md:col-span-3' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isMultiStrain ? 'Strain Names (one per line)' : 'Strain Name'}
            </label>
            {isMultiStrain ? (
              <textarea
                value={strainList}
                onChange={(e) => setStrainList(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all h-32"
                placeholder="Enter strain names, one per line..."
              />
            ) : (
              <input
                type="text"
                value={strain}
                onChange={(e) => setStrain(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                placeholder="Enter strain name..."
              />
            )}
          </div>

          {/* Date Received */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Received
            </label>
            <input
              type="date"
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
            />
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cannabinoid Profile
            </label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value as CannabinoidProfile)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-900"
            >
              <option value="high-thc">High THC (20-30%)</option>
              <option value="medium-thc">Medium THC (10-20%)</option>
              <option value="low-thc">Low THC (1-10%)</option>
              <option value="hemp">Hemp/CBD (&lt;0.3% THC)</option>
              <option value="decarbed">Decarbed/Concentrate</option>
            </select>
          </div>
        </div>

        {/* THCA Compliance Checkbox */}
        <div className="mt-6 flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isTHCACompliance}
              onChange={(e) => setIsTHCACompliance(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
            />
            <span className="text-sm text-gray-700">
              Generate THCA Compliance (Total THC &lt; 0.3%)
            </span>
          </label>

          {/* Generate Button */}
          {isMultiStrain ? (
            <button
              onClick={onGenerateBatch}
              disabled={isGeneratingBatch || !strainList.trim()}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isGeneratingBatch ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg font-medium"
            >
              Generate COA
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 
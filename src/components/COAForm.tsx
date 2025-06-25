import React from 'react';
import { COAData, CustomRanges, CannabinoidProfile, ComprehensiveValidationResult } from '@/types';
import { 
  generateTHCProfile, 
  generateFullCannabinoidProfile,
  percentToMgPerG,
  validateCOAComprehensive
} from '@/utils';
import {
  CANNABINOID_NAMES,
  CANNABINOID_LIMITS
} from '@/constants';
import { LAB_EMPLOYEES, SAMPLE_SIZE_OPTIONS } from '@/constants/defaults';
import ValidationPanel from './ValidationPanel';

interface COAFormProps {
  data: COAData;
  onChange: (data: COAData) => void;
  selectedProfile?: CannabinoidProfile;
  onProfileChange?: (profile: CannabinoidProfile) => void;
  customRanges?: CustomRanges;
  onCustomRangesChange?: (ranges: CustomRanges) => void;
  showCustomRanges?: boolean;
  onShowCustomRangesChange?: (show: boolean) => void;
}

const COAForm: React.FC<COAFormProps> = ({ 
  data, 
  onChange,
  selectedProfile = 'high-thc',
  onProfileChange,
  customRanges = {
    thcaMin: 15,
    thcaMax: 25,
    d9thcMin: 0.2,
    d9thcMax: 1.2
  },
  onCustomRangesChange,
  showCustomRanges = false,
  onShowCustomRangesChange
}) => {
  const [validationResult, setValidationResult] = React.useState<ComprehensiveValidationResult | null>(null);
  const [showValidation, setShowValidation] = React.useState(false);

  const updateField = (field: keyof COAData, value: string | number | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const updateCannabinoid = (index: number, field: string, value: string | number) => {
    const newCannabinoids = [...data.cannabinoids];
    newCannabinoids[index] = { ...newCannabinoids[index], [field]: value };
    
    // Auto-calculate mgPerG when percentWeight changes
    if (field === 'percentWeight') {
      newCannabinoids[index].mgPerG = percentToMgPerG(value as number);
    }
    
    onChange({ ...data, cannabinoids: newCannabinoids });
  };

  const addCannabinoid = () => {
    const newCannabinoid = {
      name: '',
      percentWeight: 0,
      mgPerG: 0,
      loq: 0,
      lod: 0,
      result: 'ND' as const
    };
    onChange({ ...data, cannabinoids: [...data.cannabinoids, newCannabinoid] });
  };

  const removeCannabinoid = (index: number) => {
    const newCannabinoids = data.cannabinoids.filter((_, i) => i !== index);
    onChange({ ...data, cannabinoids: newCannabinoids });
  };

  const validateCurrentCOA = () => {
    const result = validateCOAComprehensive(data);
    setValidationResult(result);
    setShowValidation(true);
  };

  const generateTHCRanges = () => {
    const ranges = showCustomRanges ? customRanges : undefined;
    const profile = generateTHCProfile(selectedProfile, ranges);
    
    // Update or add THCA
    const thcaIndex = data.cannabinoids.findIndex(c => c.name === CANNABINOID_NAMES.THCA || c.name === 'THCA');
    if (thcaIndex >= 0) {
      updateCannabinoid(thcaIndex, 'percentWeight', profile.thca);
      updateCannabinoid(thcaIndex, 'mgPerG', percentToMgPerG(profile.thca));
      updateCannabinoid(thcaIndex, 'result', 'detected');
    } else {
      const newCannabinoid = {
        name: CANNABINOID_NAMES.THCA,
        percentWeight: profile.thca,
        mgPerG: percentToMgPerG(profile.thca),
        loq: CANNABINOID_LIMITS.THCa.loq,
        lod: CANNABINOID_LIMITS.THCa.lod,
        result: 'detected' as const
      };
      onChange({ ...data, cannabinoids: [...data.cannabinoids, newCannabinoid] });
    }

    // Update or add D9-THC
    const d9thcIndex = data.cannabinoids.findIndex(c => c.name === CANNABINOID_NAMES.D9THC || c.name === 'D9-THC');
    if (d9thcIndex >= 0) {
      updateCannabinoid(d9thcIndex, 'percentWeight', profile.d9thc);
      updateCannabinoid(d9thcIndex, 'mgPerG', percentToMgPerG(profile.d9thc));
      updateCannabinoid(d9thcIndex, 'result', 'detected');
    } else {
      const newCannabinoid = {
        name: CANNABINOID_NAMES.D9THC,
        percentWeight: profile.d9thc,
        mgPerG: percentToMgPerG(profile.d9thc),
        loq: CANNABINOID_LIMITS['Δ9-THC'].loq,
        lod: CANNABINOID_LIMITS['Δ9-THC'].lod,
        result: 'detected' as const
      };
      onChange({ ...data, cannabinoids: [...data.cannabinoids, newCannabinoid] });
    }

    // Update CBGa if exists
    const cbgaIndex = data.cannabinoids.findIndex(c => c.name === CANNABINOID_NAMES.CBGA || c.name === 'CBGA');
    if (cbgaIndex >= 0) {
      updateCannabinoid(cbgaIndex, 'percentWeight', profile.cbga);
      updateCannabinoid(cbgaIndex, 'mgPerG', percentToMgPerG(profile.cbga));
      updateCannabinoid(cbgaIndex, 'result', profile.cbga > 0.88 ? 'detected' : 'ND');
    }

    // Update CBG if exists
    const cbgIndex = data.cannabinoids.findIndex(c => c.name === CANNABINOID_NAMES.CBG);
    if (cbgIndex >= 0) {
      updateCannabinoid(cbgIndex, 'percentWeight', profile.cbg);
      updateCannabinoid(cbgIndex, 'mgPerG', percentToMgPerG(profile.cbg));
      updateCannabinoid(cbgIndex, 'result', profile.cbg > 0.39 ? 'detected' : 'ND');
    }

    // Update total THC
    updateField('totalTHC', profile.totalTHC);
    
    // Recalculate total cannabinoids
    const totalCannabinoids = profile.thca + profile.d9thc + profile.cbga + profile.cbg + (data.totalCBD || 0);
    updateField('totalCannabinoids', parseFloat(totalCannabinoids.toFixed(2)));
  };

  const generateFullProfile = () => {
    const profile = generateFullCannabinoidProfile(selectedProfile, showCustomRanges ? customRanges : undefined);
    
    onChange({ 
      ...data, 
      cannabinoids: profile.cannabinoids,
      totalTHC: profile.totalTHC,
      totalCBD: profile.totalCBD,
      totalCannabinoids: profile.totalCannabinoids
    });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProfile = e.target.value as CannabinoidProfile;
    if (onProfileChange) {
      onProfileChange(newProfile);
    }
  };

  const handleShowCustomRangesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onShowCustomRangesChange) {
      onShowCustomRangesChange(e.target.checked);
    }
  };

  const handleCustomRangeChange = (field: keyof CustomRanges, value: number) => {
    if (onCustomRangesChange) {
      onCustomRangesChange({ ...customRanges, [field]: value });
    }
  };

  const handleLabEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmployee = LAB_EMPLOYEES.find(emp => emp.name === e.target.value);
    if (selectedEmployee) {
      updateField('labDirector', selectedEmployee.name);
      updateField('directorTitle', selectedEmployee.role);
    }
  };

  return (
    <div className="space-y-8">
      {/* THCA/D9 THC Range Generator */}
      <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 border-b border-blue-300 pb-2">THCA/D9 THC Range Generator</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">Profile Type</label>
            <select
              value={selectedProfile}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="high-thc">High THCA (22-30% THCA, 0.05-0.29% D9-THC)</option>
              <option value="medium-thc">Medium THCA (15-20% THCA, 0.05-0.29% D9-THC)</option>
              <option value="low-thc">Low THCA (0-15% THCA, 0.05-0.29% D9-THC)</option>
              <option value="hemp">Hemp/CBD (0.1-0.3% THCA, 0.05-0.29% D9-THC)</option>
              <option value="decarbed">Decarbed (1-5% THCA, 0.05-0.29% D9-THC)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="customRanges"
              checked={showCustomRanges}
              onChange={handleShowCustomRangesChange}
              className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="customRanges" className="text-sm font-medium text-blue-800">
              Use Custom Ranges
            </label>
          </div>

          {showCustomRanges && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded border border-blue-200">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">THCA Min %</label>
                <input
                  type="number"
                  step="0.1"
                  value={customRanges.thcaMin}
                  onChange={(e) => handleCustomRangeChange('thcaMin', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">THCA Max %</label>
                <input
                  type="number"
                  step="0.1"
                  value={customRanges.thcaMax}
                  onChange={(e) => handleCustomRangeChange('thcaMax', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">D9-THC Min %</label>
                <input
                  type="number"
                  step="0.01"
                  value={customRanges.d9thcMin}
                  onChange={(e) => handleCustomRangeChange('d9thcMin', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">D9-THC Max %</label>
                <input
                  type="number"
                  step="0.01"
                  value={customRanges.d9thcMax}
                  onChange={(e) => handleCustomRangeChange('d9thcMax', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={generateTHCRanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Generate THC/THCA Only
            </button>
            <button
              onClick={generateFullProfile}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              Generate Full Profile
            </button>

          </div>
        </div>
      </div>

      {/* Lab Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Lab Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab Name</label>
            <input
              type="text"
              value={data.labName}
              onChange={(e) => updateField('labName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
            <select
              value={data.labDirector}
              onChange={handleLabEmployeeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Lab Employee</option>
              {LAB_EMPLOYEES.map((employee) => (
                <option key={employee.name} value={employee.name}>
                  {employee.name} - {employee.role}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab Contact</label>
            <textarea
              value={data.labContact}
              onChange={(e) => updateField('labContact', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Sample Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Sample Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sample Name</label>
            <input
              type="text"
              value={data.sampleName}
              onChange={(e) => updateField('sampleName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strain</label>
            <input
              type="text"
              value={data.strain}
              onChange={(e) => updateField('strain', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sample ID</label>
            <input
              type="text"
              value={data.sampleId}
              onChange={(e) => updateField('sampleId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
            <input
              type="text"
              value={data.batchId}
              onChange={(e) => updateField('batchId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sample Size</label>
            <div className="flex gap-2">
              <select
                value={SAMPLE_SIZE_OPTIONS.find(option => option.value === data.sampleSize)?.value || 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    // Keep current value if it's not in the predefined options
                    const isPredefineOption = SAMPLE_SIZE_OPTIONS.some(option => option.value === data.sampleSize);
                    if (isPredefineOption) {
                      updateField('sampleSize', '');
                    }
                  } else {
                    updateField('sampleSize', e.target.value);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {SAMPLE_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {(!SAMPLE_SIZE_OPTIONS.some(option => option.value === data.sampleSize) || 
                SAMPLE_SIZE_OPTIONS.find(option => option.value === data.sampleSize)?.value === 'custom') && (
                <input
                  type="text"
                  value={data.sampleSize}
                  onChange={(e) => updateField('sampleSize', e.target.value)}
                  placeholder="Enter custom size"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
            <input
              type="text"
              value={data.sampleType}
              onChange={(e) => updateField('sampleType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Client Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              value={data.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
            <textarea
              value={data.clientAddress}
              onChange={(e) => updateField('clientAddress', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Test Dates</h3>
        <div className="grid grid-cols-1 gap-6">
          {/* Date Collected Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date Collected Range</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={data.dateCollected}
                  onChange={(e) => updateField('dateCollected', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={data.dateCollectedEnd || data.dateCollected}
                  onChange={(e) => updateField('dateCollectedEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Date Received Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date Received Range</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={data.dateReceived}
                  onChange={(e) => updateField('dateReceived', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={data.dateReceivedEnd || data.dateReceived}
                  onChange={(e) => updateField('dateReceivedEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Date Completed Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date Completed Range</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={data.dateTested}
                  onChange={(e) => updateField('dateTested', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={data.dateTestedEnd || data.dateTested}
                  onChange={(e) => updateField('dateTestedEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Date Reported (single date) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date Reported</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={data.dateReported}
                onChange={(e) => updateField('dateReported', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cannabinoids */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
          <h3 className="text-lg font-medium text-gray-900">Cannabinoids</h3>
          <button
            onClick={addCannabinoid}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Add Cannabinoid
          </button>
        </div>
        <div className="space-y-2">
          {data.cannabinoids.map((cannabinoid, index) => (
            <div key={index} className="grid grid-cols-6 gap-2 items-center p-3 bg-gray-50 rounded-md">
              <input
                type="text"
                value={cannabinoid.name}
                onChange={(e) => updateCannabinoid(index, 'name', e.target.value)}
                placeholder="Name"
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={cannabinoid.percentWeight}
                onChange={(e) => updateCannabinoid(index, 'percentWeight', parseFloat(e.target.value) || 0)}
                placeholder="% Weight"
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={cannabinoid.mgPerG}
                onChange={(e) => updateCannabinoid(index, 'mgPerG', parseFloat(e.target.value) || 0)}
                placeholder="mg/g"
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={cannabinoid.loq}
                onChange={(e) => updateCannabinoid(index, 'loq', parseFloat(e.target.value) || 0)}
                placeholder="LOQ"
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={cannabinoid.lod}
                onChange={(e) => updateCannabinoid(index, 'lod', parseFloat(e.target.value) || 0)}
                placeholder="LOD"
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={() => removeCannabinoid(index)}
                className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Totals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total THC %</label>
            <input
              type="number"
              step="0.01"
              value={data.totalTHC}
              onChange={(e) => updateField('totalTHC', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total CBD %</label>
            <input
              type="number"
              step="0.01"
              value={data.totalCBD}
              onChange={(e) => updateField('totalCBD', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Cannabinoids %</label>
            <input
              type="number"
              step="0.01"
              value={data.totalCannabinoids}
              onChange={(e) => updateField('totalCannabinoids', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Test Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Test Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries({
            testsBatch: 'Batch',
            testsCannabinoids: 'Cannabinoids',
            testsMoisture: 'Moisture',
            testsHeavyMetals: 'Heavy Metals',
            testsPesticides: 'Pesticides',
            testsMicrobials: 'Microbials'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={data[key as keyof COAData] as boolean}
                onChange={(e) => updateField(key as keyof COAData, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Other Tests */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Other Tests</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Moisture %</label>
          <input
            type="number"
            step="0.01"
            value={data.moisture || 0}
            onChange={(e) => updateField('moisture', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Notes</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Method Reference & Notes</label>
          <textarea
            value={data.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Validation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h3 className="text-lg font-medium text-gray-900">COA Validation</h3>
          <div className="flex gap-2">
            <button
              onClick={validateCurrentCOA}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors font-medium text-sm"
            >
              Validate COA
            </button>
            {showValidation && (
              <button
                onClick={() => setShowValidation(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium text-sm"
              >
                Hide Results
              </button>
            )}
          </div>
        </div>
        
        {showValidation && validationResult && (
          <ValidationPanel validationResult={validationResult} />
        )}
      </div>
    </div>
  );
};

export default COAForm; 
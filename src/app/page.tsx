'use client';

import { useState, useCallback, useEffect } from 'react';
import { ProductType, CannabinoidProfile, ComprehensiveValidationResult } from '@/types';
import { useCOAGeneration, useCOAExport } from '@/hooks';
import { useSupabaseUpload } from '@/hooks/useSupabaseUpload';
import { 
  getTodayString,
  getUserFriendlyMessage,
  setNotificationCallback,
  validateCOAComprehensive
} from '@/utils';
import COATemplate from '@/components/COATemplate';
import COAForm from '@/components/COAForm';
import { COAControls } from '@/components/COAControls';
import { COAActions } from '@/components/COAActions';
import { useNotifications } from '@/components/NotificationSystem';
import ValidationPanel from '@/components/ValidationPanel';
import SupabaseStatus from '@/components/SupabaseStatus';

export default function Home() {
  // Notification system
  const { showNotification } = useNotifications();
  
  // Set up error notification callback
  useEffect(() => {
    setNotificationCallback((message) => showNotification('error', message));
  }, [showNotification]);
  
  // Form state
  const [strain, setStrain] = useState('');
  const [dateReceived, setDateReceived] = useState(getTodayString());
  const [selectedProfile, setSelectedProfile] = useState<CannabinoidProfile>('high-thc');
  const [productType, setProductType] = useState<ProductType>('flower');

  const [isPreview, setIsPreview] = useState(true);
  
  // COAForm state
  const [formProfile, setFormProfile] = useState<CannabinoidProfile>('high-thc');
  const [customRanges, setCustomRanges] = useState({
    thcaMin: 15,
    thcaMax: 25,
    d9thcMin: 0.2,
    d9thcMax: 1.2
  });
  const [showCustomRanges, setShowCustomRanges] = useState(false);
  
  // Multi-strain state
  const [isMultiStrain, setIsMultiStrain] = useState(false);
  const [strainList, setStrainList] = useState('');
  
  // Validation state
  const [validationResult, setValidationResult] = useState<ComprehensiveValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(true);
  
  // Use custom hooks
  const {
    coaData,
    setCOAData,
    generateNewCOA,
    updateProfile,
    generatedCOAs,
    currentCOAIndex,
    isGeneratingBatch,
    generateMultipleCOAs,
    goToCOA,
    burnAllData
  } = useCOAGeneration('Sample Strain', dateReceived, productType);
  
  const {
    componentRef,
    handlePrint,
    exportSinglePDF,
    exportAllCOAs,
    isExporting,
    exportProgress
  } = useCOAExport();
  
  const {
    uploadSingleCOA,
    uploadAllCOAs,
    isUploading,
    uploadProgress
  } = useSupabaseUpload(componentRef);
  
  // Validation effect - run validation whenever COA data changes
  useEffect(() => {
    if (coaData && coaData.cannabinoids.length > 0) {
      try {
        // Filter out the current COA from the comparison to avoid false positives
        // Only exclude the exact same COA (same sample ID), but allow comparison with other COAs
        const previousCOAs = generatedCOAs.filter(coa => 
          coa.sampleId !== coaData.sampleId
        );
        
        const result = validateCOAComprehensive(coaData, previousCOAs);
        setValidationResult(result);
        
        // Show notification for critical errors
        if (result.errors.length > 0) {
          const criticalErrors = result.errors.filter(e => e.severity === 'error');
          if (criticalErrors.length > 0) {
            showNotification('warning', `Validation found ${criticalErrors.length} critical error(s)`);
          }
        }
      } catch (error) {
        console.error('Validation error:', error);
        setValidationResult(null);
      }
    } else {
      setValidationResult(null);
    }
  }, [coaData, generatedCOAs, showNotification]);
  
  // Generate single COA
  const handleGenerateSingle = useCallback(() => {
    try {
      generateNewCOA(strain || 'Sample Strain', dateReceived, productType);
      
      // Apply profile if not default
      if (selectedProfile !== 'high-thc') {
        setTimeout(() => updateProfile(selectedProfile), 100);
      }
      
      setIsPreview(true);
      showNotification('success', 'COA generated successfully');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [strain, dateReceived, productType, selectedProfile, generateNewCOA, updateProfile, showNotification]);
  
  // Generate multiple COAs
  const handleGenerateBatch = useCallback(async () => {
    try {
      const strains = strainList
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 25); // Limit to 25
      
      if (strains.length === 0) {
        showNotification('warning', 'Please enter at least one strain name');
        return;
      }
      
      await generateMultipleCOAs(strains, dateReceived, productType, selectedProfile);
      
      setIsPreview(true);
      showNotification('success', `Generated ${strains.length} COAs successfully`);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [strainList, dateReceived, productType, selectedProfile, generateMultipleCOAs, showNotification]);
  
  // Export handlers
  const handleExportPDF = useCallback(async () => {
    try {
      // Check validation before export
      if (validationResult && validationResult.errors.length > 0) {
        const confirmed = window.confirm(
          `This COA has ${validationResult.errors.length} validation error(s). Do you want to export anyway?`
        );
        if (!confirmed) return;
      }
      
      await exportSinglePDF(coaData, setCOAData);
      showNotification('success', 'PDF exported successfully');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [coaData, exportSinglePDF, showNotification, validationResult]);
  
  const handleExportAllCOAs = useCallback(async () => {
    try {
      // Use the current COA data and update function for bulk export
      await exportAllCOAs(generatedCOAs, coaData, setCOAData);
      showNotification('success', 'All COAs exported successfully');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [generatedCOAs, coaData, setCOAData, exportAllCOAs, showNotification]);

  // Supabase upload handlers
  const handleUploadToSupabase = useCallback(async () => {
    try {
      // Check validation before upload
      if (validationResult && validationResult.errors.length > 0) {
        const confirmed = window.confirm(
          `This COA has ${validationResult.errors.length} validation error(s). Do you want to upload anyway?`
        );
        if (!confirmed) return;
      }
      
      const uploadedUrl = await uploadSingleCOA(coaData, setCOAData);
      showNotification('success', 'COA uploaded successfully to cloud storage!');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [coaData, uploadSingleCOA, showNotification, validationResult]);
  
  const handleUploadAllToSupabase = useCallback(async () => {
    try {
      const uploadedUrls = await uploadAllCOAs(generatedCOAs, coaData, setCOAData);
      showNotification('success', `${uploadedUrls.length} COAs uploaded successfully to cloud storage`);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [generatedCOAs, coaData, setCOAData, uploadAllCOAs, showNotification]);

  // BURN batch handler
  const handleBurnBatch = useCallback(async () => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to BURN all session data? This will erase all ${generatedCOAs.length} COA(s) and reset all forms. This action cannot be undone.`
      );
      if (!confirmed) return;
      
      const coaCount = generatedCOAs.length;
      
      // Show burning notification
      showNotification('info', 'Burning all session data...');
      
      // Clear all COA data
      burnAllData();
      
      // Reset all form states to defaults
      setStrain('');
      setDateReceived(getTodayString());
      setSelectedProfile('high-thc');
      setProductType('flower');
      setFormProfile('high-thc');
      setCustomRanges({
        thcaMin: 15,
        thcaMax: 25,
        d9thcMin: 0.2,
        d9thcMax: 1.2
      });
      setShowCustomRanges(false);
      setIsMultiStrain(false);
      setStrainList('');
      setValidationResult(null);
      setIsPreview(true);
      
      // Show success notification after a brief delay
      setTimeout(() => {
        showNotification('success', `Successfully burned ${coaCount > 0 ? coaCount + ' COA(s) and' : ''} all session data`);
      }, 500);
      
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [
    generatedCOAs.length, 
    burnAllData, 
    showNotification,
    setStrain,
    setDateReceived,
    setSelectedProfile,
    setProductType,
    setFormProfile,
    setCustomRanges,
    setShowCustomRanges,
    setIsMultiStrain,
    setStrainList,
    setValidationResult,
    setIsPreview
  ]);

  // PUSH TO LAB handler
  const handlePushToLab = useCallback(async () => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to push ${generatedCOAs.length} COA(s) to the lab?`
      );
      if (!confirmed) return;
      
      // Simulate pushing to lab
      showNotification('info', 'Pushing COAs to lab...');
      
      // Add a delay to simulate the lab push process
      setTimeout(() => {
        showNotification('success', `Successfully pushed ${generatedCOAs.length} COA(s) to lab`);
      }, 2000);
      
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [generatedCOAs.length, showNotification]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            COA Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate professional Certificate of Analysis documents with custom cannabinoid profiles
          </p>
          <div className="mt-4 flex justify-center">
            <SupabaseStatus />
          </div>
        </div>

        {/* Controls */}
        <COAControls
          strain={strain}
          setStrain={setStrain}
          dateReceived={dateReceived}
          setDateReceived={setDateReceived}
          productType={productType}
          setProductType={setProductType}
          selectedProfile={selectedProfile}
          setSelectedProfile={setSelectedProfile}
          isMultiStrain={isMultiStrain}
          setIsMultiStrain={setIsMultiStrain}
          strainList={strainList}
          setStrainList={setStrainList}
          onGenerate={handleGenerateSingle}
          onGenerateBatch={handleGenerateBatch}
          isGeneratingBatch={isGeneratingBatch}
        />

        {/* Actions */}
        <COAActions
          isPreview={isPreview}
          setIsPreview={setIsPreview}
          onPrint={handlePrint}
          onExportPDF={handleExportPDF}
          onExportAllCOAs={generatedCOAs.length > 0 ? handleExportAllCOAs : undefined}
          onUploadToSupabase={handleUploadToSupabase}
          onUploadAllToSupabase={generatedCOAs.length > 0 ? handleUploadAllToSupabase : undefined}
          isMultiStrain={isMultiStrain}
          generatedCOAs={generatedCOAs}
          currentCOAIndex={currentCOAIndex}
          onNavigateCOA={goToCOA}
          isExporting={isExporting}
          exportProgress={exportProgress}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onBurnBatch={handleBurnBatch}
          onPushToLab={handlePushToLab}
        />

        {/* Validation Panel */}
        {showValidation && validationResult && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">COA Validation</h2>
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {showValidation ? 'Hide' : 'Show'} Validation
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ValidationPanel validationResult={validationResult} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`grid ${isPreview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-8`}>
          {/* Edit Form */}
          {!isPreview && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit COA Information</h2>
              <COAForm 
                data={coaData} 
                onChange={setCOAData}
                selectedProfile={formProfile}
                onProfileChange={setFormProfile}
                customRanges={customRanges}
                onCustomRangesChange={setCustomRanges}
                showCustomRanges={showCustomRanges}
                onShowCustomRangesChange={setShowCustomRanges}
              />
            </div>
          )}
          
          {/* Preview */}
          <div className={isPreview ? 'col-span-full' : ''}>
            <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">COA Preview</h2>
                {validationResult && (
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ❌ {validationResult.errors.length} Error(s)
                      </span>
                    )}
                    {validationResult.warnings.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ {validationResult.warnings.length} Warning(s)
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-2">
                <div className="bg-white mx-auto shadow-lg max-w-full overflow-x-auto">
                  <COATemplate ref={componentRef} data={coaData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
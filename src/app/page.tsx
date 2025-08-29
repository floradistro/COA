'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ProductType, CannabinoidProfile, ComprehensiveValidationResult } from '@/types';
import { useCOAGeneration } from '@/hooks';
import { useSupabaseUpload } from '@/hooks/useSupabaseUpload';
import { 
  getTodayString,
  getUserFriendlyMessage,
  setNotificationCallback,
  validateCOAComprehensive
} from '@/utils';
import { DEFAULT_SAMPLE_SIZE, CLIENT_OPTIONS, LAB_EMPLOYEES } from '@/constants/defaults';
import COATemplate from '@/components/COATemplate';
import COAForm from '@/components/COAForm';
import { COAControls } from '@/components/COAControls';
import { useNotifications } from '@/components/NotificationSystem';
import SupabaseStatus from '@/components/SupabaseStatus';

export default function Home() {
  // Client-side only rendering to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Notification system
  const { showNotification } = useNotifications();
  
  // Component ref for PDF generation
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Preview scaling ref
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Set up error notification callback
  useEffect(() => {
    setNotificationCallback((message) => showNotification('error', message));
  }, [showNotification]);
  
  // Form state
  const [strain, setStrain] = useState('');
  const [dateReceived, setDateReceived] = useState(getTodayString());
  const [dateReceivedEnd, setDateReceivedEnd] = useState(getTodayString());
  const [dateCollected, setDateCollected] = useState(getTodayString());
  const [dateCollectedEnd, setDateCollectedEnd] = useState(getTodayString());
  const [dateTested, setDateTested] = useState(getTodayString());
  const [dateTestedEnd, setDateTestedEnd] = useState(getTodayString());
  const [selectedProfile, setSelectedProfile] = useState<CannabinoidProfile>('high-thc');
  const [selectedLabEmployee, setSelectedLabEmployee] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [sampleSize, setSampleSize] = useState<string>(DEFAULT_SAMPLE_SIZE);
  const [productType, setProductType] = useState<ProductType>('flower');
  
  // Edible specific state
  const [edibleDosage, setEdibleDosage] = useState<number>(10); // mg

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
  
  // Use custom hooks
  const {
    coaData,
    setCOAData,
    generateNewCOA,
    updateProfile,
    generatedCOAs,
    setGeneratedCOAs,
    currentCOAIndex,
    isGeneratingBatch,
    generateMultipleCOAs,
    goToCOA,
    burnAllData
  } = useCOAGeneration('Sample Strain', dateReceived, productType);
  

  
  const {
    uploadSingleCOA,
    uploadAllCOAs,
    isUploading,
    uploadProgress
  } = useSupabaseUpload(componentRef);
  
  // Live update effect - instantly update COA when client selection changes
  useEffect(() => {
    // Only update if we have an existing COA
    if (coaData && coaData.cannabinoids.length > 0) {
      console.log('Instantly updating COA client information');
      const selectedClientData = selectedClient 
        ? CLIENT_OPTIONS.find(c => c.name === selectedClient) || CLIENT_OPTIONS[0]
        : CLIENT_OPTIONS[0];
      
      setCOAData(current => ({
        ...current,
        clientName: selectedClientData.name,
        clientAddress: selectedClientData.address
      }));
      
      // Also update all generated COAs in batch using current state
      setGeneratedCOAs(currentCOAs => 
        currentCOAs.map(coa => ({
          ...coa,
          clientName: selectedClientData.name,
          clientAddress: selectedClientData.address
        }))
      );
    }
  }, [selectedClient]); // Only trigger on client changes

  // Live update effect - instantly update COA when lab employee selection changes  
  useEffect(() => {
    // Only update if we have an existing COA
    if (coaData && coaData.cannabinoids.length > 0) {
      console.log('Instantly updating COA lab employee information');
      const selectedEmployeeData = selectedLabEmployee 
        ? LAB_EMPLOYEES.find(emp => emp.name === selectedLabEmployee) || LAB_EMPLOYEES[Math.floor(Math.random() * LAB_EMPLOYEES.length)]
        : LAB_EMPLOYEES[Math.floor(Math.random() * LAB_EMPLOYEES.length)];
      
      setCOAData(current => ({
        ...current,
        labDirector: selectedEmployeeData.name,
        directorTitle: selectedEmployeeData.role
      }));
      
      // Also update all generated COAs in batch using current state
      setGeneratedCOAs(currentCOAs => 
        currentCOAs.map(coa => ({
          ...coa,
          labDirector: selectedEmployeeData.name,
          directorTitle: selectedEmployeeData.role
        }))
      );
    }
  }, [selectedLabEmployee]); // Only trigger on lab employee changes

  // Sync current COA changes back to the batch array
  useEffect(() => {
    // Only sync if we have batch COAs and the current COA has been modified
    if (generatedCOAs.length > 0 && coaData && currentCOAIndex >= 0 && currentCOAIndex < generatedCOAs.length) {
      // Check if the current COA data differs from the one in the batch array
      const batchCOA = generatedCOAs[currentCOAIndex];
      if (batchCOA && (
        batchCOA.productImageUrl !== coaData.productImageUrl ||
        batchCOA.clientName !== coaData.clientName ||
        batchCOA.labDirector !== coaData.labDirector
      )) {
        console.log(`Syncing changes back to batch COA ${currentCOAIndex}`);
        setGeneratedCOAs(currentCOAs => 
          currentCOAs.map((coa, index) => 
            index === currentCOAIndex ? { ...coaData } : coa
          )
        );
      }
    }
  }, [coaData, currentCOAIndex]); // Trigger when current COA data or index changes

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
  
  // Handle preview scaling for mobile
  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current && isPreview) {
        const container = previewRef.current;
        const containerWidth = container.offsetWidth;
        const coaWidth = 794; // Fixed COA width
        const scaleFactor = Math.min(1, containerWidth / coaWidth);
        
        container.style.setProperty('--scale-factor', scaleFactor.toString());
        
        // Adjust container height based on scale with a slight delay
        setTimeout(() => {
          const scaledContainer = container.querySelector('.transform-gpu') as HTMLElement;
          if (scaledContainer) {
            const originalHeight = scaledContainer.scrollHeight / scaleFactor;
            container.style.height = `${originalHeight * scaleFactor}px`;
          }
        }, 100);
      }
    };

    // Initial resize with delay to ensure DOM is ready
    setTimeout(handleResize, 200);
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [isPreview, coaData]);
  
  // Generate single COA
  const handleGenerateSingle = useCallback(() => {
    try {
      console.log('Generating single COA with:', { strain, dateReceived, productType, selectedProfile });
      generateNewCOA(strain || 'Sample Strain', dateReceived, productType, {
        dateReceivedEnd,
        dateCollected,
        dateCollectedEnd,
        dateTested,
        dateTestedEnd
      }, selectedLabEmployee, sampleSize, edibleDosage, selectedClient);
      
      // Apply profile if not default
      if (selectedProfile !== 'high-thc') {
        setTimeout(() => updateProfile(selectedProfile), 100);
      }
      
      setIsPreview(true);
      showNotification('success', 'COA generated successfully');
      
      // Debug: Check COA data after generation
      setTimeout(() => {
        console.log('COA data after generation:', coaData);
        console.log('Cannabinoids count:', coaData?.cannabinoids?.length);
      }, 200);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [strain, dateReceived, dateReceivedEnd, dateCollected, dateCollectedEnd, dateTested, dateTestedEnd, productType, selectedProfile, selectedLabEmployee, selectedClient, sampleSize, edibleDosage, generateNewCOA, updateProfile, showNotification, setIsPreview, coaData]);
  
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
      
      await generateMultipleCOAs(strains, dateReceived, productType, selectedProfile, {
        dateReceivedEnd,
        dateCollected,
        dateCollectedEnd,
        dateTested,
        dateTestedEnd
      }, selectedLabEmployee, sampleSize, edibleDosage, selectedClient);
      
      setIsPreview(true);
      showNotification('success', `Generated ${strains.length} COAs successfully`);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [strainList, dateReceived, dateReceivedEnd, dateCollected, dateCollectedEnd, dateTested, dateTestedEnd, productType, selectedProfile, selectedLabEmployee, selectedClient, sampleSize, edibleDosage, generateMultipleCOAs, showNotification]);
  




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
      
      await uploadSingleCOA(coaData, setCOAData, generatedCOAs, setGeneratedCOAs, currentCOAIndex);
      showNotification('success', 'COA uploaded successfully to cloud storage!');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [coaData, uploadSingleCOA, showNotification, validationResult, generatedCOAs, setGeneratedCOAs, currentCOAIndex, setCOAData]);
  
  const handleUploadAllToSupabase = useCallback(async () => {
    try {
      const uploadedUrls = await uploadAllCOAs(generatedCOAs, coaData, setCOAData, setGeneratedCOAs);
      showNotification('success', `${uploadedUrls.length} COAs uploaded successfully to cloud storage`);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [generatedCOAs, coaData, setCOAData, uploadAllCOAs, showNotification, setGeneratedCOAs]);

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
      setDateReceivedEnd(getTodayString());
      setDateCollected(getTodayString());
      setDateCollectedEnd(getTodayString());
      setDateTested(getTodayString());
      setDateTestedEnd(getTodayString());
      setSelectedProfile('high-thc');
      setSelectedLabEmployee('');
      setSelectedClient('');
      setSampleSize(DEFAULT_SAMPLE_SIZE);
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



  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900">Loading WhaleTools...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-3 sm:mb-4" style={{ fontFamily: 'Lobster, cursive' }}>
            WhaleTools
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            Professional cannabis testing and analysis tools for Certificate of Analysis generation
          </p>
          <div className="mt-3 sm:mt-4 flex justify-center">
            <SupabaseStatus />
          </div>
        </div>

        {/* Controls */}
        <COAControls
          strain={strain}
          setStrain={setStrain}
          dateReceived={dateReceived}
          setDateReceived={setDateReceived}
          dateReceivedEnd={dateReceivedEnd}
          setDateReceivedEnd={setDateReceivedEnd}
          dateCollected={dateCollected}
          setDateCollected={setDateCollected}
          dateCollectedEnd={dateCollectedEnd}
          setDateCollectedEnd={setDateCollectedEnd}
          dateTested={dateTested}
          setDateTested={setDateTested}
          dateTestedEnd={dateTestedEnd}
          setDateTestedEnd={setDateTestedEnd}
          productType={productType}
          setProductType={setProductType}
          selectedProfile={selectedProfile}
          setSelectedProfile={setSelectedProfile}
          selectedLabEmployee={selectedLabEmployee}
          setSelectedLabEmployee={setSelectedLabEmployee}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          sampleSize={sampleSize}
          setSampleSize={setSampleSize}
          isMultiStrain={isMultiStrain}
          setIsMultiStrain={setIsMultiStrain}
          strainList={strainList}
          setStrainList={setStrainList}
          // Edible props
          edibleDosage={edibleDosage}
          setEdibleDosage={setEdibleDosage}
          onGenerate={handleGenerateSingle}
          onGenerateBatch={handleGenerateBatch}
          isGeneratingBatch={isGeneratingBatch}
          // Action props
          isPreview={isPreview}
          setIsPreview={setIsPreview}
          onUploadToSupabase={handleUploadToSupabase}
          onUploadAllToSupabase={generatedCOAs.length > 0 ? handleUploadAllToSupabase : undefined}
          generatedCOAs={generatedCOAs}
          currentCOAIndex={currentCOAIndex}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onBurnBatch={handleBurnBatch}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          {/* Edit Form */}
          {!isPreview && (
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Edit COA Information</h2>
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
          
          {/* Preview Display */}
          {isPreview && coaData && (
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">COA Preview</h2>
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-1 sm:p-2 coa-preview-container">
                <div ref={previewRef} className="bg-white mx-auto shadow-lg w-full overflow-hidden">
                  <div className="w-full transform-gpu" style={{ 
                    transformOrigin: 'top left',
                    transform: 'scale(var(--scale-factor, 1))'
                  }}>
                    <COATemplate 
                      data={coaData}
                      isMultiStrain={isMultiStrain}
                      generatedCOAs={generatedCOAs}
                      currentCOAIndex={currentCOAIndex}
                      onNavigateCOA={goToCOA}
                      validationResult={validationResult || undefined}
                      isPreviewMode={true}
                      onUpdateData={setCOAData}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden COA Template for Export - Always rendered but hidden */}
      <div 
        className="coa-export-wrapper"
        style={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '0',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        <div 
          className="coa-export-container"
          data-export-container="true"
          style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '794px',
            minHeight: '1123px',
            backgroundColor: 'white',
            transform: 'translateY(0)'
          }}
        >
          {coaData && coaData.cannabinoids && coaData.cannabinoids.length > 0 && (
            <div style={{ backgroundColor: 'white', padding: '8px' }}>
              <COATemplate ref={componentRef} data={coaData} onUpdateData={setCOAData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering to avoid hydration issues with ID generation
export const dynamic = 'force-dynamic'; 
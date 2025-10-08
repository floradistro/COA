'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ProductType, CannabinoidProfile, ComprehensiveValidationResult, Client } from '@/types';
import { useCOAGeneration } from '@/hooks';
import { useSupabaseUpload } from '@/hooks/useSupabaseUpload';
import { supabase } from '@/lib/supabaseClient';
import { 
  getTodayString,
  getUserFriendlyMessage,
  setNotificationCallback,
  validateCOAComprehensive
} from '@/utils';
import { DEFAULT_SAMPLE_SIZE } from '@/constants/defaults';
import COATemplate from '@/components/COATemplate';
import { COAControls } from '@/components/COAControls';
import { useNotifications } from '@/components/NotificationSystem';
import SupabaseStatus from '@/components/SupabaseStatus';
import Link from 'next/link';

export default function Home() {
  // Client-side only rendering to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  
  // Notification system
  const { showNotification } = useNotifications();
  
  // Component ref for PDF generation
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Preview scaling ref
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [strain, setStrain] = useState('');
  const [dateReceived, setDateReceived] = useState(getTodayString());
  const [dateCollected, setDateCollected] = useState(getTodayString());
  const [dateTested, setDateTested] = useState(getTodayString());
  const [dateTestedEnd, setDateTestedEnd] = useState(getTodayString());
  const [selectedProfile, setSelectedProfile] = useState<CannabinoidProfile>('high-thc');
  const [selectedLabEmployee, setSelectedLabEmployee] = useState<string>('');
  const [sampleSize, setSampleSize] = useState<string>(DEFAULT_SAMPLE_SIZE);
  const [productType, setProductType] = useState<ProductType>('flower');
  
  // Edible specific state
  const [edibleDosage, setEdibleDosage] = useState<number>(10); // mg
  
  // Client state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(true);

  
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
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Set up error notification callback
  useEffect(() => {
    setNotificationCallback((message) => showNotification('error', message));
  }, [showNotification]);
  
  // Fetch clients from database
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        setClients(data || []);
        // Auto-select first client if available and generate initial COA
        if (data && data.length > 0) {
          setSelectedClientId(data[0].id);
          
          // Update the initial COA with client data
          setCOAData(prev => ({
            ...prev,
            clientName: data[0].name,
            clientAddress: data[0].address,
            licenseNumber: data[0].license_number
          }));
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        showNotification('error', 'Failed to load clients');
      } finally {
        setLoadingClients(false);
      }
    };
    
    if (isClient) {
      fetchClients();
    }
  }, [isClient, showNotification, setCOAData]);
  

  
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
  
  // Handle preview scaling for mobile
  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current) {
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
  }, [coaData]);
  
  // Get selected client data
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientData = selectedClient ? {
    clientName: selectedClient.name,
    clientAddress: selectedClient.address,
    licenseNumber: selectedClient.license_number
  } : undefined;
  
  // Auto-update COA when client selection changes
  useEffect(() => {
    if (coaData && selectedClient && coaData.clientName !== selectedClient.name) {
      console.log('Client changed, updating COA with new client data:', selectedClient.name);
      const updatedCOA = {
        ...coaData,
        clientName: selectedClient.name,
        clientAddress: selectedClient.address,
        licenseNumber: selectedClient.license_number
      };
      setCOAData(updatedCOA);
    }
  }, [selectedClientId, selectedClient, coaData, setCOAData]);
  
  // Auto-update COA when product type changes (after initial load)
  useEffect(() => {
    if (coaData && coaData.sampleId && productType !== coaData.sampleType) {
      console.log('Product type changed, regenerating COA:', productType);
      const currentStrain = strain || coaData.strain || 'Sample Strain';
      generateNewCOA(currentStrain, dateReceived, productType, {
        dateCollected,
        dateTested,
        dateTestedEnd
      }, selectedLabEmployee, sampleSize, edibleDosage, clientData);
      
      if (selectedProfile !== 'high-thc') {
        setTimeout(() => updateProfile(selectedProfile), 100);
      }
    }
  }, [productType]);
  
  // Auto-update COA when profile changes (after initial load)
  useEffect(() => {
    if (coaData && coaData.sampleId) {
      console.log('Profile changed, updating COA:', selectedProfile);
      updateProfile(selectedProfile);
    }
  }, [selectedProfile]);
  
  // Auto-update COA when lab employee changes
  useEffect(() => {
    if (coaData && selectedLabEmployee) {
      console.log('Lab employee changed, updating COA:', selectedLabEmployee);
      const updatedCOA = {
        ...coaData,
        labDirector: selectedLabEmployee,
        directorTitle: selectedLabEmployee === 'Sarah Mitchell' ? 'Laboratory Director' : 
                       selectedLabEmployee === 'Michael Minogue' ? 'Head Scientist' : 'Laboratory Tech'
      };
      setCOAData(updatedCOA);
    }
  }, [selectedLabEmployee, coaData?.sampleId, setCOAData]);
  
  // Auto-update COA when sample size changes
  useEffect(() => {
    if (coaData && sampleSize && coaData.sampleSize !== sampleSize) {
      console.log('Sample size changed, updating COA:', sampleSize);
      setCOAData(prev => ({ ...prev, sampleSize }));
    }
  }, [sampleSize, coaData, setCOAData]);
  
  // Auto-update COA when edible dosage changes (for edibles only)
  useEffect(() => {
    if (coaData && productType === 'edible' && edibleDosage && coaData.edibleDosage !== edibleDosage) {
      console.log('Edible dosage changed, regenerating cannabinoid profile:', edibleDosage);
      const edibleProfile = require('@/utils').generateEdibleCannabinoidProfile(edibleDosage, coaData.sampleSize);
      setCOAData(prev => ({
        ...prev,
        edibleDosage,
        cannabinoids: edibleProfile.cannabinoids,
        totalTHC: edibleProfile.totalTHC,
        totalCBD: edibleProfile.totalCBD,
        totalCannabinoids: edibleProfile.totalCannabinoids
      }));
    }
  }, [edibleDosage, productType, coaData?.sampleId, coaData?.sampleSize, setCOAData]);
  
  // Auto-update COA when dates change
  useEffect(() => {
    if (coaData && coaData.sampleId) {
      const needsUpdate = 
        coaData.dateCollected !== dateCollected ||
        coaData.dateReceived !== dateReceived ||
        coaData.dateTested !== dateTested;
      
      if (needsUpdate) {
        console.log('Dates changed, updating COA');
        setCOAData(prev => ({
          ...prev,
          dateCollected,
          dateReceived,
          dateTested,
          dateTestedEnd,
          approvalDate: dateTested,
          dateReported: dateTested
        }));
      }
    }
  }, [dateCollected, dateReceived, dateTested, dateTestedEnd, coaData?.sampleId, setCOAData]);
  
  // Generate single COA
  const handleGenerateSingle = useCallback(() => {
    try {
      console.log('Generating single COA with:', { strain, dateReceived, productType, selectedProfile, client: clientData?.clientName });
      generateNewCOA(strain || 'Sample Strain', dateReceived, productType, {
        dateCollected,
        dateTested,
        dateTestedEnd
      }, selectedLabEmployee, sampleSize, edibleDosage, clientData);
      
      // Apply profile if not default
      if (selectedProfile !== 'high-thc') {
        setTimeout(() => updateProfile(selectedProfile), 100);
      }
      
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
  }, [strain, dateReceived, dateCollected, dateTested, dateTestedEnd, productType, selectedProfile, selectedLabEmployee, sampleSize, edibleDosage, clientData, generateNewCOA, updateProfile, showNotification, coaData]);
  
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
        dateCollected,
        dateTested,
        dateTestedEnd
      }, selectedLabEmployee, sampleSize, edibleDosage, clientData);
      
      showNotification('success', `Generated ${strains.length} COAs successfully`);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [strainList, dateReceived, dateCollected, dateTested, dateTestedEnd, productType, selectedProfile, selectedLabEmployee, sampleSize, edibleDosage, clientData, generateMultipleCOAs, showNotification]);
  




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
      setDateCollected(getTodayString());
      setDateTested(getTodayString());
      setDateTestedEnd(getTodayString());
      setSelectedProfile('high-thc');
      setSelectedLabEmployee('');
      setSampleSize(DEFAULT_SAMPLE_SIZE);
      setProductType('flower');
      setIsMultiStrain(false);
      setStrainList('');
      setValidationResult(null);
      
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
    setIsMultiStrain,
    setStrainList,
    setValidationResult
  ]);



  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neutral-400 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-neutral-200">Loading WhaleTools...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-neutral-700/50 shadow-xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-neutral-100 mb-3 sm:mb-4" style={{ fontFamily: 'Lobster, cursive' }}>
            WhaleTools
          </h1>
          <p className="text-base sm:text-xl text-neutral-300 max-w-2xl mx-auto px-2">
            Professional cannabis testing and analysis tools for Certificate of Analysis generation
          </p>
          
          {/* Client Selector */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-3">
              <label htmlFor="client-select" className="text-sm font-medium text-neutral-300">
                Client:
              </label>
              <select
                id="client-select"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={loadingClients || clients.length === 0}
                className="px-4 py-2 bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {loadingClients ? (
                  <option>Loading clients...</option>
                ) : clients.length === 0 ? (
                  <option>No clients available</option>
                ) : (
                  clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <Link 
              href="/clients"
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Manage Clients
            </Link>
          </div>
          
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
          dateCollected={dateCollected}
          setDateCollected={setDateCollected}
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
          {/* Preview Display */}
          {coaData && (
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-8 border border-neutral-700/50">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 mb-4 sm:mb-6">COA Preview</h2>
              <div className="border-2 border-neutral-700/50 rounded-xl overflow-hidden bg-neutral-900/50 p-1 sm:p-2 coa-preview-container">
                <div ref={previewRef} className="bg-neutral-900/50 mx-auto shadow-lg w-full overflow-hidden">
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
              <COATemplate ref={componentRef} data={coaData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering to avoid hydration issues with ID generation
export const dynamic = 'force-dynamic'; 
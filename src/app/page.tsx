'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ProductType, CannabinoidProfile, ComprehensiveValidationResult, Client, COAData } from '@/types';
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
  
  // Consolidated form state
  const [formState, setFormState] = useState({
    strain: '',
    dateReceived: getTodayString(),
    dateCollected: getTodayString(),
    dateTested: getTodayString(),
    dateTestedEnd: getTodayString(),
    selectedProfile: 'high-thc' as CannabinoidProfile,
    selectedLabEmployee: '',
    sampleSize: DEFAULT_SAMPLE_SIZE,
    productType: 'flower' as ProductType,
    edibleDosage: 10,
    isMultiStrain: false,
    strainList: ''
  });
  
  // Client state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(true);
  
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
  } = useCOAGeneration('Sample Strain', formState.dateReceived, formState.productType);
  
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
          setCOAData((prev: COAData) => ({
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
  
  // Validation effect - run validation only when new COA is generated
  useEffect(() => {
    if (coaData && coaData.cannabinoids.length > 0 && coaData.sampleId) {
      try {
        const previousCOAs = generatedCOAs.filter(coa => 
          coa.sampleId !== coaData.sampleId
        );
        
        const result = validateCOAComprehensive(coaData, previousCOAs);
        setValidationResult(result);
      } catch (error) {
        console.error('Validation error:', error);
        setValidationResult(null);
      }
    } else {
      setValidationResult(null);
    }
  }, [coaData?.sampleId, generatedCOAs.length]);
  
  // Handle preview scaling for mobile
  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current) {
        const container = previewRef.current;
        const containerWidth = container.offsetWidth;
        const coaWidth = 794; // Fixed COA width
        const scaleFactor = Math.min(1, containerWidth / coaWidth);
        
        container.style.transform = `scale(${scaleFactor})`;
        container.style.transformOrigin = 'top center';
        container.style.width = '794px';
        container.style.height = 'auto';
      }
    };

    setTimeout(handleResize, 200);
    window.addEventListener('resize', handleResize);
    
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
      setCOAData((prev: COAData) => ({
        ...prev,
        clientName: selectedClient.name,
        clientAddress: selectedClient.address,
        licenseNumber: selectedClient.license_number
      }));
    }
  }, [selectedClientId, selectedClient?.name, coaData?.clientName, setCOAData]);
  
  // Auto-update COA when product type changes (after initial load)
  useEffect(() => {
    if (coaData && coaData.sampleId && formState.productType !== coaData.sampleType) {
      const currentStrain = formState.strain || coaData.strain || 'Sample Strain';
      generateNewCOA(currentStrain, formState.dateReceived, formState.productType, {
        dateCollected: formState.dateCollected,
        dateTested: formState.dateTested,
        dateTestedEnd: formState.dateTestedEnd
      }, formState.selectedLabEmployee, formState.sampleSize, formState.edibleDosage, clientData);
      
      if (formState.selectedProfile !== 'high-thc') {
        setTimeout(() => updateProfile(formState.selectedProfile), 100);
      }
    }
  }, [formState.productType, coaData?.sampleId, coaData?.sampleType]);
  
  // Auto-update COA when profile changes (after initial load)
  useEffect(() => {
    if (coaData && coaData.sampleId) {
      updateProfile(formState.selectedProfile);
    }
  }, [formState.selectedProfile, coaData?.sampleId, updateProfile]);
  
  // Auto-update COA when lab employee changes
  useEffect(() => {
    if (coaData && formState.selectedLabEmployee && coaData.labDirector !== formState.selectedLabEmployee) {
      setCOAData((prev: COAData) => ({
        ...prev,
        labDirector: formState.selectedLabEmployee,
        directorTitle: formState.selectedLabEmployee === 'Sarah Mitchell' ? 'Laboratory Director' : 
                       formState.selectedLabEmployee === 'Michael Minogue' ? 'Head Scientist' : 'Laboratory Tech'
      }));
    }
  }, [formState.selectedLabEmployee, coaData?.labDirector, setCOAData]);
  
  // Auto-update COA when sample size changes
  useEffect(() => {
    if (coaData && formState.sampleSize && coaData.sampleSize !== formState.sampleSize) {
      setCOAData((prev: COAData) => ({ ...prev, sampleSize: formState.sampleSize }));
    }
  }, [formState.sampleSize, coaData?.sampleSize, setCOAData]);
  
  // Auto-update COA when edible dosage changes (for edibles only)
  useEffect(() => {
    if (coaData && formState.productType === 'edible' && formState.edibleDosage && coaData.edibleDosage !== formState.edibleDosage) {
      const edibleProfile = require('@/utils').generateEdibleCannabinoidProfile(formState.edibleDosage, coaData.sampleSize);
      setCOAData((prev: COAData) => ({
        ...prev,
        edibleDosage: formState.edibleDosage,
        cannabinoids: edibleProfile.cannabinoids,
        totalTHC: edibleProfile.totalTHC,
        totalCBD: edibleProfile.totalCBD,
        totalCannabinoids: edibleProfile.totalCannabinoids
      }));
    }
  }, [formState.edibleDosage, formState.productType, coaData?.edibleDosage, setCOAData]);
  
  // Auto-update COA when dates change
  useEffect(() => {
    if (coaData && coaData.sampleId) {
      const needsUpdate = 
        coaData.dateCollected !== formState.dateCollected ||
        coaData.dateReceived !== formState.dateReceived ||
        coaData.dateTested !== formState.dateTested;
      
      if (needsUpdate) {
        setCOAData((prev: COAData) => ({
          ...prev,
          dateCollected: formState.dateCollected,
          dateReceived: formState.dateReceived,
          dateTested: formState.dateTested,
          dateTestedEnd: formState.dateTestedEnd,
          approvalDate: formState.dateTested,
          dateReported: formState.dateTested
        }));
      }
    }
  }, [formState.dateCollected, formState.dateReceived, formState.dateTested, formState.dateTestedEnd, coaData?.dateCollected, coaData?.dateReceived, coaData?.dateTested, setCOAData]);
  
  // Generate single COA
  const handleGenerateSingle = useCallback(() => {
    try {
      generateNewCOA(formState.strain || 'Sample Strain', formState.dateReceived, formState.productType, {
        dateCollected: formState.dateCollected,
        dateTested: formState.dateTested,
        dateTestedEnd: formState.dateTestedEnd
      }, formState.selectedLabEmployee, formState.sampleSize, formState.edibleDosage, clientData);
      
      if (formState.selectedProfile !== 'high-thc') {
        setTimeout(() => updateProfile(formState.selectedProfile), 100);
      }
      
      showNotification('success', 'COA generated successfully');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [formState, clientData, generateNewCOA, updateProfile, showNotification]);
  
  // Generate multiple COAs
  const handleGenerateBatch = useCallback(async () => {
    try {
      const strains = formState.strainList
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 25);
      
      if (strains.length === 0) {
        showNotification('warning', 'Please enter at least one strain name');
        return;
      }
      
      await generateMultipleCOAs(strains, formState.dateReceived, formState.productType, formState.selectedProfile, {
        dateCollected: formState.dateCollected,
        dateTested: formState.dateTested,
        dateTestedEnd: formState.dateTestedEnd
      }, formState.selectedLabEmployee, formState.sampleSize, formState.edibleDosage, clientData);
      
      showNotification('success', `Generated ${strains.length} COAs successfully`);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [formState, clientData, generateMultipleCOAs, showNotification]);
  




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
      showNotification('info', 'Burning all session data...');
      
      burnAllData();
      
      // Reset form state to defaults
      setFormState({
        strain: '',
        dateReceived: getTodayString(),
        dateCollected: getTodayString(),
        dateTested: getTodayString(),
        dateTestedEnd: getTodayString(),
        selectedProfile: 'high-thc',
        selectedLabEmployee: '',
        sampleSize: DEFAULT_SAMPLE_SIZE,
        productType: 'flower',
        edibleDosage: 10,
        isMultiStrain: false,
        strainList: ''
      });
      
      setValidationResult(null);
      
      setTimeout(() => {
        showNotification('success', `Successfully burned ${coaCount > 0 ? coaCount + ' COA(s) and' : ''} all session data`);
      }, 500);
      
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [generatedCOAs.length, burnAllData, showNotification]);



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
          strain={formState.strain}
          setStrain={(value) => setFormState(prev => ({ ...prev, strain: value }))}
          dateReceived={formState.dateReceived}
          setDateReceived={(value) => setFormState(prev => ({ ...prev, dateReceived: value }))}
          dateCollected={formState.dateCollected}
          setDateCollected={(value) => setFormState(prev => ({ ...prev, dateCollected: value }))}
          dateTested={formState.dateTested}
          setDateTested={(value) => setFormState(prev => ({ ...prev, dateTested: value }))}
          dateTestedEnd={formState.dateTestedEnd}
          setDateTestedEnd={(value) => setFormState(prev => ({ ...prev, dateTestedEnd: value }))}
          productType={formState.productType}
          setProductType={(value) => setFormState(prev => ({ ...prev, productType: value }))}
          selectedProfile={formState.selectedProfile}
          setSelectedProfile={(value) => setFormState(prev => ({ ...prev, selectedProfile: value }))}
          selectedLabEmployee={formState.selectedLabEmployee}
          setSelectedLabEmployee={(value) => setFormState(prev => ({ ...prev, selectedLabEmployee: value }))}
          sampleSize={formState.sampleSize}
          setSampleSize={(value) => setFormState(prev => ({ ...prev, sampleSize: value }))}
          isMultiStrain={formState.isMultiStrain}
          setIsMultiStrain={(value) => setFormState(prev => ({ ...prev, isMultiStrain: value }))}
          strainList={formState.strainList}
          setStrainList={(value) => setFormState(prev => ({ ...prev, strainList: value }))}
          edibleDosage={formState.edibleDosage}
          setEdibleDosage={(value) => setFormState(prev => ({ ...prev, edibleDosage: value }))}
          onGenerate={handleGenerateSingle}
          onGenerateBatch={handleGenerateBatch}
          isGeneratingBatch={isGeneratingBatch}
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
              <div className="border-2 border-neutral-700/50 rounded-xl overflow-auto bg-neutral-900/50 p-1 sm:p-2 coa-preview-container flex justify-center">
                <div 
                  ref={previewRef} 
                  className="bg-white shadow-lg"
                  style={{ 
                    width: '794px',
                    minWidth: '794px',
                    transformOrigin: 'top center'
                  }}
                >
                  <div style={{ padding: '8px' }}>
                    <COATemplate 
                      ref={componentRef}
                      data={coaData}
                      isMultiStrain={formState.isMultiStrain}
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
    </div>
  );
}

// Force dynamic rendering to avoid hydration issues with ID generation
export const dynamic = 'force-dynamic'; 
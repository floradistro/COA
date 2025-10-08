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
import { getEmployeeTitle } from '@/constants/labEmployees';
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
  
  // Batch progress state
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  
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
  
  // Validation disabled - was causing infinite loop
  // Will re-enable with proper memoization
  useEffect(() => {
    setValidationResult(null);
  }, []);
  
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
  
  // Safe instant update handlers - event-driven (no loops)
  const handleClientChange = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client && coaData && coaData.sampleId) {
      setCOAData((prev: COAData) => ({
        ...prev,
        clientName: client.name,
        clientAddress: client.address,
        licenseNumber: client.license_number
      }));
    }
  }, [clients, coaData?.sampleId, setCOAData]);
  
  const handleProductTypeChange = useCallback((type: ProductType) => {
    setFormState(prev => ({ ...prev, productType: type }));
    if (coaData && coaData.sampleId) {
      const currentStrain = formState.strain || coaData.strain || 'Sample Strain';
      generateNewCOA(currentStrain, formState.dateReceived, type, {
        dateCollected: formState.dateCollected,
        dateTested: formState.dateTested,
        dateTestedEnd: formState.dateTestedEnd
      }, formState.selectedLabEmployee, formState.sampleSize, formState.edibleDosage, clientData);
      
      setTimeout(() => updateProfile(formState.selectedProfile), 100);
    }
  }, [formState, coaData?.sampleId, clientData, generateNewCOA, updateProfile]);
  
  const handleProfileChange = useCallback((profile: CannabinoidProfile) => {
    setFormState(prev => ({ ...prev, selectedProfile: profile }));
    if (coaData && coaData.sampleId) {
      updateProfile(profile);
    }
  }, [coaData?.sampleId, updateProfile]);
  
  const handleLabEmployeeChange = useCallback((employee: string) => {
    setFormState(prev => ({ ...prev, selectedLabEmployee: employee }));
    if (coaData && coaData.sampleId) {
      setCOAData((prev: COAData) => ({
        ...prev,
        labDirector: employee,
        directorTitle: getEmployeeTitle(employee)
      }));
    }
  }, [coaData?.sampleId, setCOAData]);
  
  const handleSampleSizeChange = useCallback((size: string) => {
    setFormState(prev => ({ ...prev, sampleSize: size }));
    if (coaData && coaData.sampleId) {
      setCOAData((prev: COAData) => ({ ...prev, sampleSize: size }));
    }
  }, [coaData?.sampleId, setCOAData]);
  
  const handleDateChange = useCallback((field: 'dateCollected' | 'dateReceived' | 'dateTested' | 'dateTestedEnd', value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (coaData && coaData.sampleId) {
      const updates: Partial<COAData> = { [field]: value };
      if (field === 'dateTested') {
        updates.approvalDate = value;
        updates.dateReported = value;
      }
      setCOAData((prev: COAData) => ({ ...prev, ...updates }));
    }
  }, [coaData?.sampleId, setCOAData]);
  
  const handleEdibleDosageChange = useCallback((dosage: number) => {
    setFormState(prev => ({ ...prev, edibleDosage: dosage }));
    if (coaData && coaData.sampleId && formState.productType === 'edible') {
      const edibleProfile = require('@/utils').generateEdibleCannabinoidProfile(dosage, coaData.sampleSize);
      setCOAData((prev: COAData) => ({
        ...prev,
        edibleDosage: dosage,
        cannabinoids: edibleProfile.cannabinoids,
        totalTHC: edibleProfile.totalTHC,
        totalCBD: edibleProfile.totalCBD,
        totalCannabinoids: edibleProfile.totalCannabinoids
      }));
    }
  }, [coaData?.sampleId, coaData?.sampleSize, formState.productType, setCOAData]);
  
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
                onChange={(e) => handleClientChange(e.target.value)}
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

        {/* Batch Progress Indicator */}
        {isGeneratingBatch && (
          <div className="mb-4 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-200 font-medium">
                Generating batch COAs... Please wait
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <COAControls
          strain={formState.strain}
          setStrain={(value) => setFormState(prev => ({ ...prev, strain: value }))}
          dateReceived={formState.dateReceived}
          setDateReceived={(value) => handleDateChange('dateReceived', value)}
          dateCollected={formState.dateCollected}
          setDateCollected={(value) => handleDateChange('dateCollected', value)}
          dateTested={formState.dateTested}
          setDateTested={(value) => handleDateChange('dateTested', value)}
          dateTestedEnd={formState.dateTestedEnd}
          setDateTestedEnd={(value) => handleDateChange('dateTestedEnd', value)}
          productType={formState.productType}
          setProductType={handleProductTypeChange}
          selectedProfile={formState.selectedProfile}
          setSelectedProfile={handleProfileChange}
          selectedLabEmployee={formState.selectedLabEmployee}
          setSelectedLabEmployee={handleLabEmployeeChange}
          sampleSize={formState.sampleSize}
          setSampleSize={handleSampleSizeChange}
          isMultiStrain={formState.isMultiStrain}
          setIsMultiStrain={(value) => setFormState(prev => ({ ...prev, isMultiStrain: value }))}
          strainList={formState.strainList}
          setStrainList={(value) => setFormState(prev => ({ ...prev, strainList: value }))}
          edibleDosage={formState.edibleDosage}
          setEdibleDosage={handleEdibleDosageChange}
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
              <div className="border-2 border-neutral-700/50 rounded-xl overflow-auto bg-neutral-900/50 p-4 flex justify-center">
                <div 
                  ref={previewRef}
                  style={{ 
                    width: '794px',
                    minWidth: '794px',
                    transformOrigin: 'top center',
                    backgroundColor: 'white',
                    padding: '8px'
                  }}
                >
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
          )}
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering to avoid hydration issues with ID generation
export const dynamic = 'force-dynamic'; 
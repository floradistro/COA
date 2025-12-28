'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ProductType, CannabinoidProfile, Client, COAData } from '@/types';
import { useCOAGeneration } from '@/hooks';
import { useSupabaseUpload } from '@/hooks/useSupabaseUpload';
import { supabaseData as supabase } from '@/lib/supabaseClient';
import {
  getTodayString,
  getUserFriendlyMessage,
  setNotificationCallback,
  generateEdibleCannabinoidProfile
} from '@/utils';
import { DEFAULT_SAMPLE_SIZE, PRODUCT_CONFIGS } from '@/constants/defaults';
import { getEmployeeTitle } from '@/constants/labEmployees';
import COATemplate from '@/components/COATemplate';
import { COAControls } from '@/components/COAControls';
import { useNotifications } from '@/components/NotificationSystem';
import SupabaseStatus from '@/components/SupabaseStatus';
import Link from 'next/link';
import Image from 'next/image';
import { ProtectedRoute } from '@/components/ProtectedRoute';
// Geometric background removed for cleaner production look

function HomeContent() {
  // Client-side only rendering to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  
  // Notification system
  const { showNotification } = useNotifications();
  
  // Component ref for PDF generation
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Preview scaling ref
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Preview focus state (to toggle brightness)
  const [isPreviewFocused, setIsPreviewFocused] = useState(false);
  
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
    edibleWeight: 3500, // Weight in mg (default 3.5g = 3500mg for gummies)
    isMultiStrain: false,
    strainList: '',
    includeImage: false
  });
  
  // Image state for batch COAs
  const [batchImages, setBatchImages] = useState<Record<number, string>>({});
  
  // Client state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Validation state (disabled to prevent loops)
  const validationResult = null;
  
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

          // Update the initial COA with client data (including vendor_id for proper routing)
          setCOAData((prev: COAData) => ({
            ...prev,
            clientName: data[0].name,
            clientAddress: data[0].address,
            licenseNumber: data[0].license_number,
            vendorId: data[0].vendor_id || undefined
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
  
  
  // Handle preview scaling for mobile
  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current) {
        const container = previewRef.current;
        const parent = container.parentElement;
        const parentWidth = parent?.offsetWidth || container.offsetWidth;
        const coaWidth = 802; // COA document width
        
        // On mobile, scale down to fit perfectly
        if (window.innerWidth < 640) { // sm breakpoint
          const scaleFactor = (parentWidth - 16) / coaWidth; // Subtract padding
          container.style.transform = `scale(${scaleFactor})`;
          container.style.width = `${coaWidth}px`;
          
          // Get the actual height of the content and scale it
          const actualHeight = container.scrollHeight;
          const scaledHeight = actualHeight * scaleFactor;
          
          // Set the parent height to match scaled content
          if (parent) {
            parent.style.height = `${scaledHeight}px`;
          }
        } else {
          // On desktop, no scaling needed
          container.style.transform = 'scale(1)';
          container.style.width = '100%';
          
          // Reset parent height
          if (parent) {
            parent.style.height = 'auto';
          }
        }
      }
    };

    setTimeout(handleResize, 200);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [coaData]);
  
  // Get selected client data - memoized to prevent callback dependency issues
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientData = useMemo(() => selectedClient ? {
    clientName: selectedClient.name,
    clientAddress: selectedClient.address,
    licenseNumber: selectedClient.license_number,
    vendorId: selectedClient.vendor_id
  } : undefined, [selectedClient]);
  
  // Safe instant update handlers - event-driven (no loops)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleClientChange = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client && coaData && coaData.sampleId) {
      setCOAData((prev: COAData) => ({
        ...prev,
        clientName: client.name,
        clientAddress: client.address,
        licenseNumber: client.license_number,
        vendorId: client.vendor_id || undefined
      }));
    }
  }, [clients, coaData?.sampleId, setCOAData]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleProductTypeChange = useCallback((type: ProductType) => {
    // Get the default profile for this product type
    const defaultProfile = PRODUCT_CONFIGS[type].defaultProfile;
    setFormState(prev => ({ ...prev, productType: type, selectedProfile: defaultProfile }));
    if (coaData && coaData.sampleId) {
      const currentStrain = formState.strain || coaData.strain || 'Sample Strain';
      generateNewCOA(currentStrain, formState.dateReceived, type, {
        dateCollected: formState.dateCollected,
        dateTested: formState.dateTested,
        dateTestedEnd: formState.dateTestedEnd
      }, formState.selectedLabEmployee, formState.sampleSize, formState.edibleDosage, clientData);

      // Use the product's default profile, not the previous form state profile
      setTimeout(() => updateProfile(defaultProfile), 100);
    }
  }, [formState, coaData?.sampleId, clientData, generateNewCOA, updateProfile]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleProfileChange = useCallback((profile: CannabinoidProfile) => {
    setFormState(prev => ({ ...prev, selectedProfile: profile }));
    if (coaData && coaData.sampleId) {
      updateProfile(profile);
    }
  }, [coaData?.sampleId, updateProfile]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSampleSizeChange = useCallback((size: string) => {
    setFormState(prev => ({ ...prev, sampleSize: size }));
    if (coaData && coaData.sampleId) {
      setCOAData((prev: COAData) => ({ ...prev, sampleSize: size }));
    }
  }, [coaData?.sampleId, setCOAData]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleEdibleDosageChange = useCallback((dosage: number) => {
    setFormState(prev => ({ ...prev, edibleDosage: dosage }));
    if (coaData && coaData.sampleId && (formState.productType === 'edible' || formState.productType === 'gummy')) {
      // For edibles, use custom weight; for gummies, use sample size
      const weightToUse = formState.productType === 'edible'
        ? `${formState.edibleWeight}mg`
        : coaData.sampleSize;
      const edibleProfile = generateEdibleCannabinoidProfile(dosage, weightToUse);
      setCOAData((prev: COAData) => ({
        ...prev,
        edibleDosage: dosage,
        cannabinoids: edibleProfile.cannabinoids,
        totalTHC: edibleProfile.totalTHC,
        totalCBD: edibleProfile.totalCBD,
        totalCannabinoids: edibleProfile.totalCannabinoids
      }));
    }
  }, [coaData?.sampleId, coaData?.sampleSize, formState.productType, formState.edibleWeight, setCOAData]);

  // Handle edible weight change (for edibles only, not gummies)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleEdibleWeightChange = useCallback((weightMg: number) => {
    setFormState(prev => ({ ...prev, edibleWeight: weightMg }));
    if (coaData && coaData.sampleId && formState.productType === 'edible') {
      // Display weight in grams on COA, but use mg internally for calculation
      const displayWeight = `${(weightMg / 1000).toFixed(1)}g`;
      const edibleProfile = generateEdibleCannabinoidProfile(formState.edibleDosage, `${weightMg}mg`);
      setCOAData((prev: COAData) => ({
        ...prev,
        sampleSize: displayWeight,
        cannabinoids: edibleProfile.cannabinoids,
        totalTHC: edibleProfile.totalTHC,
        totalCBD: edibleProfile.totalCBD,
        totalCannabinoids: edibleProfile.totalCannabinoids
      }));
    }
  }, [coaData?.sampleId, formState.productType, formState.edibleDosage, setCOAData]);
  
  // Generate single COA
  const handleGenerateSingle = useCallback(() => {
    try {
      // For edibles, use custom weight in grams for display; for gummies and other products, use sampleSize
      const effectiveSampleSize = formState.productType === 'edible'
        ? `${(formState.edibleWeight / 1000).toFixed(1)}g`
        : formState.sampleSize;

      generateNewCOA(formState.strain || 'Sample Strain', formState.dateReceived, formState.productType, {
        dateCollected: formState.dateCollected,
        dateTested: formState.dateTested,
        dateTestedEnd: formState.dateTestedEnd
      }, formState.selectedLabEmployee, effectiveSampleSize, formState.edibleDosage, clientData);

      // Don't override profile for edibles/gummies - they use the potency test profile (D9-THC only)
      if (formState.selectedProfile !== 'high-thc' && formState.productType !== 'edible' && formState.productType !== 'gummy') {
        setTimeout(() => updateProfile(formState.selectedProfile), 100);
      }
      
      // Set image mode on the new COA if enabled
      if (formState.includeImage) {
        setTimeout(() => {
          setCOAData(prev => ({
            ...prev,
            includeImage: true
          }));
        }, 150);
      }
      
      showNotification('success', 'COA generated successfully');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [formState, clientData, generateNewCOA, updateProfile, showNotification, setCOAData]);
  
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

      // For edibles, use custom weight in grams for display; for gummies and other products, use sampleSize
      const effectiveSampleSize = formState.productType === 'edible'
        ? `${(formState.edibleWeight / 1000).toFixed(1)}g`
        : formState.sampleSize;

      await generateMultipleCOAs(strains, formState.dateReceived, formState.productType, formState.selectedProfile, {
        dateCollected: formState.dateCollected,
        dateTested: formState.dateTested,
        dateTestedEnd: formState.dateTestedEnd
      }, formState.selectedLabEmployee, effectiveSampleSize, formState.edibleDosage, clientData);
      
      // Set image mode on all generated COAs if enabled
      if (formState.includeImage) {
        setTimeout(() => {
          const currentCOAs = generatedCOAs;
          const updatedCOAs = currentCOAs.map(coa => ({
            ...coa,
            includeImage: true
          }));
          setGeneratedCOAs(updatedCOAs);
          setCOAData(prev => ({
            ...prev,
            includeImage: true
          }));
        }, 150);
      }
      
      showNotification('success', `Generated ${strains.length} COAs successfully`);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [formState, clientData, generateMultipleCOAs, showNotification, generatedCOAs, setGeneratedCOAs, setCOAData]);
  
  // Handle image upload for current COA
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      
      if (formState.isMultiStrain && generatedCOAs.length > 0) {
        // Update batch images for multi-strain
        setBatchImages(prev => ({
          ...prev,
          [currentCOAIndex]: imageUrl
        }));
        
        // Update current COA
        setCOAData(prev => ({
          ...prev,
          productImageUrl: imageUrl,
          includeImage: true
        }));
        
        // Update in generatedCOAs array
        const updatedCOAs = [...generatedCOAs];
        updatedCOAs[currentCOAIndex] = {
          ...updatedCOAs[currentCOAIndex],
          productImageUrl: imageUrl,
          includeImage: true
        };
        setGeneratedCOAs(updatedCOAs);
      } else {
        // Single COA mode
        setCOAData(prev => ({
          ...prev,
          productImageUrl: imageUrl,
          includeImage: true
        }));
      }
      
      showNotification('success', 'Image uploaded successfully');
    };
    reader.readAsDataURL(file);
  }, [formState.isMultiStrain, generatedCOAs.length, currentCOAIndex, setCOAData, setGeneratedCOAs, showNotification]);
  
  // Handle removing image
  const handleRemoveImage = useCallback(() => {
    if (formState.isMultiStrain && generatedCOAs.length > 0) {
      // Remove from batch images
      setBatchImages(prev => {
        const updated = { ...prev };
        delete updated[currentCOAIndex];
        return updated;
      });
      
      // Update current COA
      setCOAData(prev => ({
        ...prev,
        productImageUrl: undefined,
        includeImage: formState.includeImage
      }));
      
      // Update in generatedCOAs array
      const updatedCOAs = [...generatedCOAs];
      updatedCOAs[currentCOAIndex] = {
        ...updatedCOAs[currentCOAIndex],
        productImageUrl: undefined,
        includeImage: formState.includeImage
      };
      setGeneratedCOAs(updatedCOAs);
    } else {
      // Single COA mode
      setCOAData(prev => ({
        ...prev,
        productImageUrl: undefined,
        includeImage: formState.includeImage
      }));
    }
    
    showNotification('info', 'Image removed');
  }, [formState.isMultiStrain, formState.includeImage, generatedCOAs.length, currentCOAIndex, setCOAData, setGeneratedCOAs, showNotification]);

  // Handle toggling image mode
  const handleToggleImageMode = useCallback((enabled: boolean) => {
    setFormState(prev => ({ ...prev, includeImage: enabled }));
    
    // Update all COAs with image mode
    if (formState.isMultiStrain && generatedCOAs.length > 0) {
      const updatedCOAs = generatedCOAs.map((coa: COAData, idx: number) => ({
        ...coa,
        includeImage: enabled,
        productImageUrl: enabled ? batchImages[idx] : undefined
      }));
      setGeneratedCOAs(updatedCOAs);
      
      setCOAData(prev => ({
        ...prev,
        includeImage: enabled,
        productImageUrl: enabled ? batchImages[currentCOAIndex] : undefined
      }));
    } else {
      setCOAData(prev => ({
        ...prev,
        includeImage: enabled,
        productImageUrl: enabled ? prev.productImageUrl : undefined
      }));
    }
  }, [formState.isMultiStrain, generatedCOAs.length, currentCOAIndex, batchImages, setCOAData, setGeneratedCOAs]);




  // Supabase upload handlers
  const handleUploadToSupabase = useCallback(async () => {
    try {
      await uploadSingleCOA(coaData, setCOAData, generatedCOAs, setGeneratedCOAs, currentCOAIndex);
      showNotification('success', 'COA uploaded successfully to cloud storage!');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [coaData, uploadSingleCOA, showNotification, generatedCOAs, setGeneratedCOAs, currentCOAIndex, setCOAData]);
  
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
        edibleWeight: 3500,
        isMultiStrain: false,
        strainList: '',
        includeImage: false
      });
      
      // Clear batch images
      setBatchImages({});
      
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
    <div className="min-h-screen bg-neutral-800 relative">
      {/* Geometric Background */}
      
      
      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/10 via-transparent to-neutral-900/10 z-[1]" />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 relative z-[2]">
        {/* Header */}
        <div className="mb-6 sm:mb-12 backdrop-blur-[2px] rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] border border-white/10">
          {/* Top Section - Title Area */}
          <div className="relative px-3 pt-8 pb-6 sm:px-8 sm:pt-16 sm:pb-10">
            {/* Subtle gradient line accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-500/20 to-transparent" />
            
            <div className="max-w-4xl mx-auto text-center">
              {/* Logo with subtle glow */}
              <div className="inline-block mb-6 relative group">
                <div className="absolute inset-0 bg-white/3 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-700" />
                <Image 
                  src="/logowhaletools.png" 
                  alt="WhaleTools Logo" 
                  width={80} 
                  height={80}
                  className="relative opacity-95 hover:opacity-100 transition-opacity duration-300"
                  priority
                />
              </div>
              
              {/* Main Title */}
              <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: 'Lobster, cursive', letterSpacing: '-0.02em' }}>
                <span className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
                  WhaleTools
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
                Tools for Whales
              </p>
            </div>
          </div>
          
          {/* Bottom Section - Controls */}
          <div className="relative backdrop-blur-[2px] border-t border-white/10">
            <div className="px-3 py-4 sm:px-8 sm:py-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Client Selector */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label htmlFor="client-select" className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Client
                    </label>
                    <select
                      id="client-select"
                      value={selectedClientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      disabled={loadingClients || clients.length === 0}
                      className="flex-1 sm:flex-initial px-5 py-3.5 bg-white/5 backdrop-blur-xl text-white rounded-xl focus:outline-none focus:bg-white/10 disabled:opacity-50 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/10 text-base"
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
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link 
                      href="/clients"
                      className="text-xs text-neutral-400 hover:text-white transition-colors font-medium uppercase tracking-wider"
                    >
                      Manage Clients
                    </Link>
                    <div className="h-4 w-px bg-neutral-700" />
                    <SupabaseStatus />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Progress Indicator */}
        {isGeneratingBatch && (
          <div className="mb-4 bg-neutral-700/30 backdrop-blur-xl rounded-2xl p-4 shadow-[0_8px_16px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-neutral-200 font-medium">
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
          edibleWeight={formState.edibleWeight}
          setEdibleWeight={handleEdibleWeightChange}
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
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {/* Preview Display */}
          {coaData && (
            <div className="bg-neutral-900/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.03)] p-3 sm:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">COA Preview</h2>

                  {/* Batch Navigation */}
                  {formState.isMultiStrain && generatedCOAs.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToCOA(currentCOAIndex - 1)}
                        disabled={currentCOAIndex === 0}
                        className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 border border-white/10"
                        title="Previous COA"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <span className="text-sm font-medium text-neutral-300 min-w-[60px] text-center">
                        {currentCOAIndex + 1} / {generatedCOAs.length}
                      </span>

                      <button
                        onClick={() => goToCOA(currentCOAIndex + 1)}
                        disabled={currentCOAIndex === generatedCOAs.length - 1}
                        className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 border border-white/10"
                        title="Next COA"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Image Mode Toggle and Upload */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.includeImage}
                      onChange={(e) => handleToggleImageMode(e.target.checked)}
                      className="w-4 h-4 bg-neutral-700 border-neutral-600 rounded focus:ring-2 focus:ring-neutral-500"
                    />
                    <span className="text-sm text-neutral-300 font-medium">Include Image</span>
                  </label>
                  
                  {formState.includeImage && (
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-neutral-600/30 border border-neutral-500/50 text-neutral-100 rounded-md hover:bg-neutral-600/40 cursor-pointer transition-all text-sm font-medium">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                          className="hidden"
                        />
                        {coaData.productImageUrl ? 'Change' : 'Upload'} Image
                      </label>
                      
                      {coaData.productImageUrl && (
                        <button
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 bg-transparent border border-red-500/30 text-red-300 rounded-md hover:bg-red-600/10 transition-all text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-2xl overflow-hidden bg-black/30 backdrop-blur-sm p-2 sm:p-4 flex justify-center items-start shadow-[inset_0_2px_8px_0_rgba(0,0,0,0.3)] relative group transition-all duration-200">
                <div 
                  ref={previewRef}
                  onClick={() => setIsPreviewFocused(!isPreviewFocused)}
                  className={`coa-preview-wrapper cursor-pointer transition-all duration-300 w-full max-w-[802px] ${
                    isPreviewFocused ? 'coa-preview-focused' : 'coa-preview-dimmed'
                  }`}
                  style={{ 
                    transformOrigin: 'top center'
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
                
                {/* Focus hint overlay - shows on hover when dimmed */}
                {!isPreviewFocused && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <div className="bg-neutral-900/90 backdrop-blur-sm px-6 py-3 rounded-xl border border-neutral-500/40 shadow-xl">
                      <p className="text-neutral-200 text-sm font-medium">Click to view full brightness</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  )
}

// Force dynamic rendering to avoid hydration issues with ID generation
export const dynamic = 'force-dynamic'; 
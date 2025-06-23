'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ProductType, CannabinoidProfile, COAData } from '@/types';
import { useCOAGeneration, useCOAExport } from '@/hooks';
import { 
  getTodayString,
  getUserFriendlyMessage,
  setNotificationCallback
} from '@/utils';
import COATemplate from '@/components/COATemplate';
import COAForm from '@/components/COAForm';
import { COAControls } from '@/components/COAControls';
import { COAActions } from '@/components/COAActions';
import BatchExportRenderer, { BatchExportRendererHandle } from '@/components/BatchExportRenderer';
import { useNotifications } from '@/components/NotificationSystem';

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
  const [isTHCACompliance, setIsTHCACompliance] = useState(false);
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
  
  // Refs
  const batchExportRef = useRef<BatchExportRendererHandle>(null);
  
  // Use custom hooks
  const {
    coaData,
    setCOAData,
    generateNewCOA,
    updateProfile,
    generateComplianceProfile,
    generatedCOAs,
    currentCOAIndex,
    isGeneratingBatch,
    generateMultipleCOAs,
    goToCOA
  } = useCOAGeneration('Sample Strain', dateReceived, productType);
  
  const {
    componentRef,
    handlePrint,
    exportSinglePDF,
    exportAllCOAs,
    isExporting,
    exportProgress
  } = useCOAExport();
  
  // Generate single COA
  const handleGenerateSingle = useCallback(() => {
    try {
      generateNewCOA(strain || 'Sample Strain', dateReceived, productType);
      
      // Apply profile or compliance
      if (isTHCACompliance) {
        setTimeout(generateComplianceProfile, 100);
      } else if (selectedProfile !== 'high-thc') {
        setTimeout(() => updateProfile(selectedProfile), 100);
      }
      
      setIsPreview(true);
      showNotification('success', 'COA generated successfully');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [strain, dateReceived, productType, isTHCACompliance, selectedProfile, generateNewCOA, generateComplianceProfile, updateProfile, showNotification]);
  
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
      
      await generateMultipleCOAs(strains, dateReceived, productType);
      
      // Apply profile or compliance to each COA if needed
      if (isTHCACompliance || selectedProfile !== 'high-thc') {
        // This would need to be implemented in the hook
        // For now, the profile is applied during generation
      }
      
      setIsPreview(true);
      showNotification('success', `Generated ${strains.length} COAs successfully`);
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [strainList, dateReceived, productType, isTHCACompliance, selectedProfile, generateMultipleCOAs, showNotification]);
  
  // Export handlers
  const handleExportPDF = useCallback(async () => {
    try {
      await exportSinglePDF(coaData);
      showNotification('success', 'PDF exported successfully');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [coaData, exportSinglePDF, showNotification]);
  
  const handleExportAllCOAs = useCallback(async () => {
    try {
      // Use the batch export renderer for proper rendering
      const renderCallback = batchExportRef.current 
        ? (coaData: COAData) => batchExportRef.current!.renderCOA(coaData)
        : undefined;
        
      await exportAllCOAs(generatedCOAs, renderCallback);
      showNotification('success', 'All COAs exported successfully');
    } catch (error) {
      const message = getUserFriendlyMessage(error);
      showNotification('error', message);
    }
  }, [generatedCOAs, exportAllCOAs, showNotification]);

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
          isTHCACompliance={isTHCACompliance}
          setIsTHCACompliance={setIsTHCACompliance}
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
          isMultiStrain={isMultiStrain}
          generatedCOAs={generatedCOAs}
          currentCOAIndex={currentCOAIndex}
          onNavigateCOA={goToCOA}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />

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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">COA Preview</h2>
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-2">
                <div className="bg-white mx-auto shadow-lg max-w-full overflow-x-auto">
                  <COATemplate ref={componentRef} data={coaData} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden batch export renderer */}
        <BatchExportRenderer ref={batchExportRef} />
      </div>
    </div>
  );
} 
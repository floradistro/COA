import { useState, useCallback } from 'react';
import { COAData, ProductType, CannabinoidProfile } from '@/types';
import { 
  generateDefaultCOAData, 
  updateCOAWithProfile,
  getTodayString,
  generateEdibleCannabinoidProfile
} from '@/utils';
import { BATCH_LIMITS } from '@/constants';

export interface UseCOAGenerationReturn {
  // Single COA
  coaData: COAData;
  setCOAData: (data: COAData) => void;
  generateNewCOA: (strain: string, dateReceived: string, productType: ProductType, dateRanges?: {
    dateCollected?: string;
    dateTested?: string;
    dateTestedEnd?: string;
  }, selectedLabEmployee?: string, sampleSize?: string, edibleDosage?: number, clientData?: {
    clientName: string;
    clientAddress: string;
    licenseNumber: string;
  }) => void;
  updateProfile: (profileType: CannabinoidProfile) => void;
  
  // Multiple COAs
  generatedCOAs: COAData[];
  setGeneratedCOAs: (coas: COAData[]) => void;
  currentCOAIndex: number;
  isGeneratingBatch: boolean;
  generateMultipleCOAs: (strains: string[], dateReceived: string, productType: ProductType, profileType?: CannabinoidProfile, dateRanges?: {
    dateCollected?: string;
    dateTested?: string;
    dateTestedEnd?: string;
  }, selectedLabEmployee?: string, sampleSize?: string, edibleDosage?: number, clientData?: {
    clientName: string;
    clientAddress: string;
    licenseNumber: string;
  }) => Promise<void>;
  goToCOA: (index: number) => void;
  clearGeneratedCOAs: () => void;
  burnAllData: () => void;
}

export const useCOAGeneration = (
  initialStrain: string = 'Sample Strain',
  initialDate: string = getTodayString(),
  initialProductType: ProductType = 'flower'
): UseCOAGenerationReturn => {
  // Single COA state
  const [coaData, setCOAData] = useState<COAData>(() => 
    generateDefaultCOAData(initialStrain, initialDate, initialProductType)
  );
  
  // Multiple COAs state
  const [generatedCOAs, setGeneratedCOAs] = useState<COAData[]>([]);
  const [currentCOAIndex, setCurrentCOAIndex] = useState(0);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  
  // Debug wrapper for setGeneratedCOAs
  const debugSetGeneratedCOAs = useCallback((coas: COAData[]) => {
    console.log('Updating generatedCOAs array with', coas.length, 'COAs');
    coas.forEach((coa, index) => {
      console.log(`COA ${index}: ${coa.sampleName} - Has QR: ${!!coa.qrCodeDataUrl}`);
    });
    setGeneratedCOAs(coas);
  }, []);
  
  // Generate a new single COA
  const generateNewCOA = useCallback((
    strain: string, 
    dateReceived: string, 
    productType: ProductType,
    dateRanges?: {
      dateCollected?: string;
      dateTested?: string;
      dateTestedEnd?: string;
    },
    selectedLabEmployee?: string,
    sampleSize?: string,
    edibleDosage?: number,
    clientData?: {
      clientName: string;
      clientAddress: string;
      licenseNumber: string;
    }
  ) => {
    const newData = generateDefaultCOAData(
      strain || 'Sample Strain', 
      dateReceived, 
      productType,
      undefined,
      undefined,
      dateRanges ? {
        dateCollected: dateRanges.dateCollected || dateReceived,
        dateReceived: dateReceived,
        dateTested: dateRanges.dateTested || dateReceived,
        dateTestedEnd: dateRanges.dateTestedEnd || dateReceived
      } : undefined,
      selectedLabEmployee,
      clientData
    );
    
    // Update sample size if provided
    if (sampleSize) {
      newData.sampleSize = sampleSize;
    }
    
    // Update edible values if provided and product type is edible
    if (productType === 'edible' && edibleDosage) {
      newData.edibleDosage = edibleDosage;
      
      // Regenerate cannabinoid profile with edible-specific calculation
      const edibleProfile = generateEdibleCannabinoidProfile(edibleDosage, newData.sampleSize);
      newData.cannabinoids = edibleProfile.cannabinoids;
      newData.totalTHC = edibleProfile.totalTHC;
      newData.totalCBD = edibleProfile.totalCBD;
      newData.totalCannabinoids = edibleProfile.totalCannabinoids;
    }
    
    setCOAData(newData);
  }, []);
  
  // Update cannabinoid profile
  const updateProfile = useCallback((profileType: CannabinoidProfile) => {
    setCOAData(current => updateCOAWithProfile(current, profileType));
  }, []);
  
  // Generate multiple COAs for batch processing
  const generateMultipleCOAs = useCallback(async (
    strains: string[], 
    dateReceived: string, 
    productType: ProductType,
    profileType?: CannabinoidProfile,
    dateRanges?: {
      dateCollected?: string;
      dateTested?: string;
      dateTestedEnd?: string;
    },
    selectedLabEmployee?: string,
    sampleSize?: string,
    edibleDosage?: number,
    clientData?: {
      clientName: string;
      clientAddress: string;
      licenseNumber: string;
    }
  ): Promise<void> => {
    // Validate input
    if (strains.length === 0) {
      throw new Error('No strains provided for batch generation');
    }
    
    if (strains.length > BATCH_LIMITS.maxCOAs) {
      throw new Error(`Cannot generate more than ${BATCH_LIMITS.maxCOAs} COAs at once`);
    }
    
    setIsGeneratingBatch(true);
    
    try {
      // Generate COAs with slight delay to show progress
      const newCOAs: COAData[] = [];
      
      for (let i = 0; i < strains.length; i++) {
        const strainName = strains[i].trim();
        if (strainName) {
          const newCOA = generateDefaultCOAData(
            strainName, 
            dateReceived, 
            productType, 
            profileType, 
            i,
            dateRanges ? {
              dateCollected: dateRanges.dateCollected || dateReceived,
              dateReceived: dateReceived,
              dateTested: dateRanges.dateTested || dateReceived,
              dateTestedEnd: dateRanges.dateTestedEnd || dateReceived
            } : undefined,
            selectedLabEmployee,
            clientData
          );
          
          // Update sample size if provided
          if (sampleSize) {
            newCOA.sampleSize = sampleSize;
          }
          
          // Update edible values if provided and product type is edible
          if (productType === 'edible' && edibleDosage) {
            newCOA.edibleDosage = edibleDosage;
            
            // Regenerate cannabinoid profile with edible-specific calculation
            const edibleProfile = generateEdibleCannabinoidProfile(edibleDosage, newCOA.sampleSize);
            newCOA.cannabinoids = edibleProfile.cannabinoids;
            newCOA.totalTHC = edibleProfile.totalTHC;
            newCOA.totalCBD = edibleProfile.totalCBD;
            newCOA.totalCannabinoids = edibleProfile.totalCannabinoids;
          }
          
          newCOAs.push(newCOA);
          
          // Small delay for UI feedback
          if (i < strains.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }
      
      setGeneratedCOAs(newCOAs);
      setCurrentCOAIndex(0);
      
      // Set the first COA as the current one
      if (newCOAs.length > 0) {
        setCOAData(newCOAs[0]);
      }
    } finally {
      setIsGeneratingBatch(false);
    }
  }, []);
  
  // Navigate to a specific COA in the batch
  const goToCOA = useCallback((index: number) => {
    if (index >= 0 && index < generatedCOAs.length) {
      setCurrentCOAIndex(index);
      const targetCOA = generatedCOAs[index];
      console.log(`Navigating to COA ${index}: ${targetCOA.sampleName}`);
      console.log('COA has QR code:', !!targetCOA.qrCodeDataUrl);
      console.log('COA QR code URL:', targetCOA.qrCodeDataUrl ? targetCOA.qrCodeDataUrl.substring(0, 50) + '...' : 'none');
      setCOAData(targetCOA);
    }
  }, [generatedCOAs]);
  
  // Clear generated COAs
  const clearGeneratedCOAs = useCallback(() => {
    setGeneratedCOAs([]);
    setCurrentCOAIndex(0);
  }, []);

  // Complete session burn - clears everything
  const burnAllData = useCallback(() => {
    // Clear all generated COAs
    setGeneratedCOAs([]);
    setCurrentCOAIndex(0);
    
    // Reset current COA to default
    const defaultData = generateDefaultCOAData(initialStrain, initialDate, initialProductType);
    setCOAData(defaultData);
  }, [initialStrain, initialDate, initialProductType]);
  
  return {
    // Single COA
    coaData,
    setCOAData,
    generateNewCOA,
    updateProfile,
    
    // Multiple COAs
    generatedCOAs,
    setGeneratedCOAs: debugSetGeneratedCOAs,
    currentCOAIndex,
    isGeneratingBatch,
    generateMultipleCOAs,
    goToCOA,
    clearGeneratedCOAs,
    burnAllData
  };
}; 
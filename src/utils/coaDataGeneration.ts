import { COAData, ProductType, CannabinoidProfile } from '@/types';
import { 
  LAB_DEFAULTS, 
  CLIENT_DEFAULTS, 
  PRODUCT_CONFIGS, 
  PRODUCT_NOTES,
  DEFAULT_TEST_STATUS
} from '@/constants/defaults';
import { generateSampleId, generateBatchId } from './idGeneration';
import { generateDates } from './dateUtils';
import { 
  generateFullCannabinoidProfile, 
  generateMoistureContent 
} from './cannabinoidGeneration';

/**
 * Generates default COA data with all necessary fields
 * @param strain - The strain name
 * @param dateReceived - Date sample was received (YYYY-MM-DD format)
 * @param productType - Type of product
 * @param profileType - Optional cannabinoid profile type (uses product default if not specified)
 * @returns Complete COA data object
 */
export const generateDefaultCOAData = (
  strain: string = 'Sample Strain',
  dateReceived: string = new Date().toISOString().split('T')[0],
  productType: ProductType = 'flower',
  profileType?: CannabinoidProfile
): COAData => {
  // Get product configuration
  const productConfig = PRODUCT_CONFIGS[productType];
  const effectiveProfile = profileType || productConfig.defaultProfile;
  
  // Generate dates
  const dates = generateDates(dateReceived);
  
  // Generate cannabinoid profile
  const profile = generateFullCannabinoidProfile(effectiveProfile);
  
  // Generate moisture content
  const moisture = generateMoistureContent();
  
  // Create COA data object
  return {
    // Lab Information
    ...LAB_DEFAULTS,
    approvalDate: dates.reported,
    
    // Sample Information
    sampleName: strain,
    sampleId: generateSampleId(),
    strain: strain,
    batchId: generateBatchId(),
    sampleType: productConfig.sampleType,
    methodReference: LAB_DEFAULTS.methodReference,
    
    // Client Information
    ...CLIENT_DEFAULTS,
    
    // Dates
    dateCollected: dates.collected,
    dateReceived: dates.received,
    dateTested: dates.tested,
    dateReported: dates.reported,
    
    // Test Status
    ...DEFAULT_TEST_STATUS,
    
    // Cannabinoids
    cannabinoids: profile.cannabinoids,
    totalTHC: profile.totalTHC,
    totalCBD: profile.totalCBD,
    totalCannabinoids: profile.totalCannabinoids,
    
    // Other Tests
    moisture: moisture,
    
    // Notes
    notes: PRODUCT_NOTES[productType]
  };
};

/**
 * Creates a blank COA data object with minimal values
 * @returns Blank COA data object
 */
export const createBlankCOAData = (): COAData => {
  const today = new Date().toISOString().split('T')[0];
  const dates = generateDates(today);
  
  return {
    // Lab Information
    ...LAB_DEFAULTS,
    approvalDate: dates.reported,
    
    // Sample Information
    sampleName: '',
    sampleId: generateSampleId(),
    strain: '',
    batchId: generateBatchId(),
    sampleType: PRODUCT_CONFIGS.flower.sampleType,
    methodReference: LAB_DEFAULTS.methodReference,
    
    // Client Information
    ...CLIENT_DEFAULTS,
    
    // Dates
    dateCollected: dates.collected,
    dateReceived: dates.received,
    dateTested: dates.tested,
    dateReported: dates.reported,
    
    // Test Status
    ...DEFAULT_TEST_STATUS,
    
    // Cannabinoids
    cannabinoids: [],
    totalTHC: 0,
    totalCBD: 0,
    totalCannabinoids: 0,
    
    // Other Tests
    moisture: 0,
    
    // Notes
    notes: PRODUCT_NOTES.flower
  };
};

/**
 * Updates COA data with new cannabinoid profile
 * @param coaData - Existing COA data
 * @param profileType - New cannabinoid profile type
 * @returns Updated COA data
 */
export const updateCOAWithProfile = (
  coaData: COAData,
  profileType: CannabinoidProfile
): COAData => {
  const profile = generateFullCannabinoidProfile(profileType);
  
  return {
    ...coaData,
    cannabinoids: profile.cannabinoids,
    totalTHC: profile.totalTHC,
    totalCBD: profile.totalCBD,
    totalCannabinoids: profile.totalCannabinoids
  };
};

/**
 * Validates COA data for completeness
 * @param coaData - COA data to validate
 * @returns Object with validation result and any error messages
 */
export const validateCOAData = (coaData: COAData): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Check required fields
  if (!coaData.sampleName || coaData.sampleName.trim() === '') {
    errors.push('Sample name is required');
  }
  
  if (!coaData.strain || coaData.strain.trim() === '') {
    errors.push('Strain name is required');
  }
  
  if (!coaData.sampleId) {
    errors.push('Sample ID is required');
  }
  
  if (!coaData.batchId) {
    errors.push('Batch ID is required');
  }
  
  if (!coaData.cannabinoids || coaData.cannabinoids.length === 0) {
    errors.push('At least one cannabinoid must be present');
  }
  
  // Validate cannabinoid data
  coaData.cannabinoids.forEach((cannabinoid, index) => {
    if (!cannabinoid.name) {
      errors.push(`Cannabinoid at index ${index} is missing a name`);
    }
    
    if (cannabinoid.percentWeight < 0) {
      errors.push(`Cannabinoid ${cannabinoid.name} has invalid percent weight`);
    }
    
    if (cannabinoid.mgPerG < 0) {
      errors.push(`Cannabinoid ${cannabinoid.name} has invalid mg/g value`);
    }
  });
  
  // Validate dates
  const dateFields: (keyof COAData)[] = ['dateCollected', 'dateReceived', 'dateTested', 'dateReported'];
  dateFields.forEach(field => {
    const value = coaData[field];
    if (!value || typeof value !== 'string' || value.trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 
import { COAData, ProductType, CannabinoidProfile } from '@/types';
import { 
  LAB_DEFAULTS, 
  CLIENT_DEFAULTS, 
  PRODUCT_CONFIGS, 
  PRODUCT_NOTES,
  DEFAULT_TEST_STATUS,
  ANALYST_NAMES,
  METHOD_REFERENCES
} from '@/constants/defaults';
import { generateSampleId, generateBatchId } from './idGeneration';
import { generateDates, generateDatesFromRanges, generateRandomDateInRange } from './dateUtils';
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
 * @param sampleIndex - Optional sample index for batch generation
 * @returns Complete COA data object
 */
export const generateDefaultCOAData = (
  strain: string = 'Sample Strain',
  dateReceived: string = new Date().toISOString().split('T')[0],
  productType: ProductType = 'flower',
  profileType?: CannabinoidProfile,
  sampleIndex?: number,
  dateRanges?: {
    dateCollected: string;
    dateCollectedEnd: string;
    dateReceived: string;
    dateReceivedEnd: string;
    dateTested: string;
    dateTestedEnd: string;
  }
): COAData => {
  // Get product configuration
  const productConfig = PRODUCT_CONFIGS[productType];
  const effectiveProfile = profileType || productConfig.defaultProfile;
  
  // Generate dates - use ranges if provided, otherwise use default generation
  const dates = dateRanges 
    ? generateDatesFromRanges(dateRanges, sampleIndex)
    : generateDates(dateReceived);
  
  // Generate cannabinoid profile with sample index
  const profile = generateFullCannabinoidProfile(effectiveProfile, undefined, sampleIndex);
  
  // Generate moisture content
  const moisture = generateMoistureContent(sampleIndex);
  
  // Select random analyst name
  const randomAnalyst = ANALYST_NAMES[Math.floor(Math.random() * ANALYST_NAMES.length)];
  
  // Select random method reference
  const randomMethodReference = METHOD_REFERENCES[Math.floor(Math.random() * METHOD_REFERENCES.length)];
  
  // Create COA data object
  return {
    // Lab Information
    ...LAB_DEFAULTS,
    labDirector: randomAnalyst,
    methodReference: randomMethodReference,
    approvalDate: dates.reported,
    
    // Sample Information
    sampleName: strain,
    sampleId: generateSampleId(sampleIndex),
    strain: strain,
    batchId: generateBatchId(sampleIndex),
    sampleType: productConfig.sampleType,
    
    // Client Information
    ...CLIENT_DEFAULTS,
    
    // Dates
    dateCollected: dates.collected,
    dateCollectedEnd: dates.collected,
    dateReceived: dates.received,
    dateReceivedEnd: dates.received,
    dateTested: dates.tested,
    dateTestedEnd: dates.tested,
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
    dateCollectedEnd: dates.collected,
    dateReceived: dates.received,
    dateReceivedEnd: dates.received,
    dateTested: dates.tested,
    dateTestedEnd: dates.tested,
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
import { COAData, ProductType, CannabinoidProfile } from '@/types';
import { 
  LAB_DEFAULTS, 
  CLIENT_DEFAULTS, 
  PRODUCT_CONFIGS, 
  PRODUCT_NOTES,
  DEFAULT_TEST_STATUS,
  LAB_EMPLOYEES,
  METHOD_REFERENCES,
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_EDIBLE_VALUES
} from '@/constants/defaults';
import { generateSampleId, generateBatchId } from './idGeneration';
import { generateDates, generateDatesFromRanges } from './dateUtils';
import { 
  generateFullCannabinoidProfile, 
  generateMoistureContent,
  generateEdibleCannabinoidProfile
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
    dateReceived: string;
    dateTested: string;
    dateTestedEnd: string;
  },
  selectedLabEmployee?: string,
  clientData?: {
    clientName: string;
    clientAddress: string | null;
    licenseNumber: string | null;
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
  const profile = productType === 'edible' && DEFAULT_EDIBLE_VALUES.dosage
    ? generateEdibleCannabinoidProfile(DEFAULT_EDIBLE_VALUES.dosage, DEFAULT_SAMPLE_SIZE)
    : generateFullCannabinoidProfile(effectiveProfile, undefined, sampleIndex);
  
  // Generate moisture content
  const moisture = generateMoistureContent(sampleIndex);
  
  // Select lab employee - use selected employee or random if none selected
  const selectedEmployee = selectedLabEmployee 
    ? LAB_EMPLOYEES.find(emp => emp.name === selectedLabEmployee)
    : null;
  const employee = selectedEmployee || LAB_EMPLOYEES[Math.floor(Math.random() * LAB_EMPLOYEES.length)];
  
  // Select random method reference
  const randomMethodReference = METHOD_REFERENCES[Math.floor(Math.random() * METHOD_REFERENCES.length)];
  
  // Process client data to handle null values
  const processedClientData = clientData ? {
    clientName: clientData.clientName,
    clientAddress: clientData.clientAddress || CLIENT_DEFAULTS.clientAddress,
    licenseNumber: clientData.licenseNumber || CLIENT_DEFAULTS.licenseNumber
  } : CLIENT_DEFAULTS;
  
  // Create COA data object
  return {
    // Lab Information
    ...LAB_DEFAULTS,
    labDirector: employee.name,
    directorTitle: employee.role,
    methodReference: randomMethodReference,
    approvalDate: dates.tested,
    
    // Sample Information
    sampleName: strain,
    sampleId: generateSampleId(sampleIndex),
    strain: strain,
    batchId: generateBatchId(sampleIndex),
    sampleSize: DEFAULT_SAMPLE_SIZE,
    sampleType: productConfig.sampleType,
    
    // Client Information
    ...processedClientData,
    
    // Dates
    dateCollected: dates.collected,
    dateReceived: dates.received,
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
    
    // Edible specific fields
    edibleDosage: productType === 'edible' ? DEFAULT_EDIBLE_VALUES.dosage : undefined,
    
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
    approvalDate: dates.tested,
    
    // Sample Information
    sampleName: '',
    sampleId: generateSampleId(),
    strain: '',
    batchId: generateBatchId(),
    sampleSize: DEFAULT_SAMPLE_SIZE,
    sampleType: PRODUCT_CONFIGS.flower.sampleType,
    methodReference: LAB_DEFAULTS.methodReference,
    
    // Client Information
    ...CLIENT_DEFAULTS,
    
    // Dates
    dateCollected: dates.collected,
    dateReceived: dates.received,
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
    
    // Edible specific fields
    edibleDosage: DEFAULT_EDIBLE_VALUES.dosage,
    
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
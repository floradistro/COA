// Cannabinoid data structure
export interface Cannabinoid {
  name: string;
  percentWeight: number;
  mgPerG: number;
  loq: number;
  lod: number;
  result: CannabinoidResult;
}

// Cannabinoid result types
export type CannabinoidResult = 'detected' | 'ND' | '< LOQ' | 'Complete' | 'Not Submitted' | 'Not Tested';

// Main COA data structure
export interface COAData {
  // Lab Information
  labName: string;
  labContact: string;
  labDirector: string;
  directorTitle: string;
  approvalDate: string;
  
  // Sample Information
  sampleName: string;
  sampleId: string;
  strain: string;
  batchId: string;
  sampleSize: string;
  sampleType: string;
  methodReference: string;
  
  // Client Information
  clientName: string;
  clientAddress: string;
  licenseNumber: string;
  
  // Dates
  dateCollected: string;
  dateReceived: string;
  dateTested: string;
  dateTestedEnd?: string;
  dateReported: string;
  
  // Test Status
  testsBatch: boolean;
  testsCannabinoids: boolean;
  testsMoisture: boolean;
  testsHeavyMetals: boolean;
  testsPesticides: boolean;
  testsMicrobials: boolean;
  
  // Cannabinoids
  cannabinoids: Cannabinoid[];
  totalTHC: number;
  totalCBD: number;
  totalCannabinoids: number;
  
  // Edible specific fields
  edibleDosage?: number; // mg per unit
  edibleWeight?: number; // weight of unit in grams
  
  // Other Tests
  moisture?: number;
  
  // Notes
  notes: string;
  
  // QR Code
  qrCodeDataUrl?: string;
  publicUrl?: string;
}

// Product types
export type ProductType = 'flower' | 'concentrate' | 'vaporizer' | 'edible' | 'beverage';

// Profile types
export type CannabinoidProfile = 'high-thc' | 'medium-thc' | 'low-thc' | 'hemp' | 'decarbed';

// Product configuration
export interface ProductConfig {
  sampleType: string;
  profileMultiplier: number;
  defaultProfile: CannabinoidProfile;
}

// Custom range configuration
export interface CustomRanges {
  thcaMin: number;
  thcaMax: number;
  d9thcMin: number;
  d9thcMax: number;
}

// Date format result
export interface FormattedDates {
  collected: string;
  received: string;
  tested: string;
  reported: string;
}

// Cannabinoid profile result
export interface CannabinoidProfileResult {
  cannabinoids: Cannabinoid[];
  totalTHC: number;
  totalCBD: number;
  totalCannabinoids: number;
}

// THC profile result
export interface THCProfileResult {
  thca: number;
  d9thc: number;
  cbga: number;
  cbg: number;
  totalTHC: number;
}

// Minor cannabinoid data
export interface MinorCannabinoidData {
  value: number;
  result: CannabinoidResult;
}

// Form state
export interface COAFormState {
  selectedProfile: CannabinoidProfile;
  customRanges: CustomRanges;
  showCustomRanges: boolean;
}

// Multi-strain state
export interface MultiStrainState {
  isMultiStrain: boolean;
  strainList: string;
  generatedCOAs: COAData[];
  currentCOAIndex: number;
  isGeneratingBatch: boolean;
}

// Validation Types
export interface ValidationError {
  type: 'cannabinoid-formula' | 'logic-consistency' | 'data-uniqueness';
  severity: 'error' | 'warning';
  message: string;
  field?: string;
  expectedValue?: number;
  actualValue?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface CannabinoidFormulaCheck {
  totalTHCCalculated: number;
  totalTHCReported: number;
  totalCBDCalculated: number;
  totalCBDReported: number;
  sumOfCannabinoidsCalculated: number;
  sumOfCannabinoidsReported: number;
  thcMismatch: number;
  cbdMismatch: number;
  sumMismatch: number;
}

export interface LogicConsistencyCheck {
  ndOrLowQPresent: boolean;
  totalCannabiniodsGteTotalTHC: boolean;
  cbdSliceExists: boolean;
  moistureInRange: boolean;
  delta8THCFlagged: boolean;
}

export interface DataUniquenessCheck {
  duplicateCannabinoidsFound: boolean;
  duplicateMoistureFound: boolean;
  duplicateBatchIdFound: boolean;
  duplicateSampleIdFound: boolean;
  previousCOAData?: COAData[];
}

export interface ComprehensiveValidationResult extends ValidationResult {
  cannabinoidFormulaCheck: CannabinoidFormulaCheck;
  logicConsistencyCheck: LogicConsistencyCheck;
  dataUniquenessCheck: DataUniquenessCheck;
}

// Client management types
export interface Client {
  id: string;
  name: string;
  address: string | null;
  license_number: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
} 
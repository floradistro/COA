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
  clientAddress: string | null;
  licenseNumber: string | null;
  
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

  // Image Mode
  includeImage?: boolean;
  productImageUrl?: string;

  // Vendor linking (for correct COA routing to vendor portals)
  vendorId?: string;
}

// Product types
export type ProductType = 'flower' | 'concentrate' | 'vaporizer' | 'disposable' | 'edible' | 'beverage' | 'gummy';

// Profile types
export type CannabinoidProfile = 'high-thc' | 'medium-thc' | 'low-thc' | 'hemp' | 'decarbed' | 'disposable-vape' | 'concentrate' | 'gummy';

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
  vendor_id?: string | null; // Links to WhaleTools vendor backend
  created_at: string;
  updated_at: string;
}

// Vendor marketplace types
export interface Vendor {
  id: string;
  email: string;
  store_name: string;
  slug: string;
  wordpress_user_id: number | null;
  status: 'active' | 'inactive' | 'pending';
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
  updated_at: string;
  logo_url: string | null;
  banner_url: string | null;
  store_description: string | null;
  store_tagline: string | null;
  brand_colors: Record<string, string> | null;
  social_links: Record<string, string> | null;
  custom_css: string | null;
  business_hours: Record<string, string | number | boolean> | null;
  return_policy: string | null;
  shipping_policy: string | null;
  total_locations: number;
  contact_name: string | null;
  tax_id: string | null;
  custom_font: string | null;
}

export interface VendorCOA {
  id: string;
  vendor_id: string;
  product_id: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string;
  lab_name: string | null;
  test_date: string | null;
  expiry_date: string | null;
  batch_number: string | null;
  test_results: Record<string, string | number | boolean> | null;
  is_active: boolean;
  is_verified: boolean;
  metadata: Record<string, string | number | boolean> | null;
  upload_date: string;
  created_at: string;
  updated_at: string;
} 
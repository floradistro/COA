import { ProductType, ProductConfig } from '@/types';

// Lab information defaults
export const LAB_DEFAULTS = {
  labName: 'Quantix Analytics',
  labContact: '5540 Centerview Dr Ste 204 #982095\nRaleigh, NC 27606\nsupport@quantixanalytics.com\nwww.quantixanalytics.com',
  labDirector: 'Sarah Mitchell',
  directorTitle: 'Laboratory Director',
  methodReference: 'HPLC-DAD, SOP QA-001'
};

// Lab employees with roles for approval signatures
export const LAB_EMPLOYEES = [
  { name: 'Sarah Mitchell', role: 'Laboratory Director' },
  { name: 'K. Patel', role: 'Laboratory Tech' }
];

// Legacy analyst names for backward compatibility
export const ANALYST_NAMES = LAB_EMPLOYEES.map(emp => emp.name);

// Footer phrase variations
export const FOOTER_PHRASES = [
  'validated under SOP QA-001',
  'SOP QA-001 applied',
  'per validated method SOP QA-001',
  'following SOP QA-001 protocols',
  'in accordance with SOP QA-001'
];

// Method reference variations
export const METHOD_REFERENCES = [
  'HPLC-DAD, SOP QA-001',
  'High Performance Liquid Chromatography with Diode Array Detection per SOP QA-001',
  'HPLC-DAD Method (SOP QA-001)',
  'Validated HPLC-DAD, SOP QA-001',
  'HPLC with DAD Detection, SOP QA-001'
];

// Client information defaults
export const CLIENT_DEFAULTS = {
  clientName: 'Flora Distribution Group LLC',
  clientAddress: '4111 E Rose Lake Dr\nCharlotte, NC 28217',
  licenseNumber: 'USDA_37_0979'
};

// Product configurations
export const PRODUCT_CONFIGS: Record<ProductType, ProductConfig> = {
  flower: {
    sampleType: 'Flower - Cured',
    profileMultiplier: 1.0,
    defaultProfile: 'high-thc'
  },
  concentrate: {
    sampleType: 'Cannabis Concentrate',
    profileMultiplier: 2.5,
    defaultProfile: 'concentrate'
  },
  vaporizer: {
    sampleType: 'Vaporizer Cartridge',
    profileMultiplier: 3.0,
    defaultProfile: 'decarbed'
  },
  disposable: {
    sampleType: 'Disposable Vaporizer',
    profileMultiplier: 3.0,
    defaultProfile: 'disposable-vape'
  },
  edible: {
    sampleType: 'Cannabis Edible',
    profileMultiplier: 0.1,
    defaultProfile: 'decarbed'
  },
  beverage: {
    sampleType: 'Cannabis Beverage',
    profileMultiplier: 0.05,
    defaultProfile: 'decarbed'
  },
  gummy: {
    sampleType: 'Cannabis Gummy',
    profileMultiplier: 0.1,
    defaultProfile: 'gummy'
  }
};

// Product notes
export const PRODUCT_NOTES: Record<ProductType, string> = {
  flower: 'Cannabinoid analysis performed using High Performance Liquid Chromatography with Diode Array Detection (HPLC-DAD) according to validated method SOP QA-001.',
  concentrate: 'Cannabis concentrate analyzed using HPLC-DAD. Values represent cannabinoid content in concentrate form. Store in cool, dry place away from light.',
  vaporizer: 'Vaporizer cartridge oil analyzed using HPLC-DAD. High concentration cannabinoid content typical for vaporizer products. Use as directed.',
  disposable: 'Disposable vaporizer analyzed using HPLC-DAD. High concentration cannabinoid content typical for vaporizer products. Single-use device, dispose responsibly.',
  edible: 'Cannabis edible analyzed using HPLC-DAD. Cannabinoid content per gram of product. Effects may be delayed. Start low and go slow.',
  beverage: 'Cannabis beverage analyzed using HPLC-DAD. Cannabinoid content per gram of liquid. Shake well before use. Effects may be delayed.',
  gummy: 'Cannabis gummy analyzed using HPLC-DAD. Cannabinoid content per gram of product. Effects may be delayed up to 2 hours. Start low and go slow.'
};

// ID generation patterns
export const ID_PATTERNS = {
  sample: {
    prefix: 'QA',
    randomDigits: 4
  },
  batch: {
    letterCount: 2,
    digitCount: 4
  }
};

// Date offsets for generating dates
export const DATE_OFFSETS = {
  collectedBeforeReceived: 1, // days
  testedAfterReceived: 2, // days
  reportedAfterTested: 1 // days
};

// Default test statuses
export const DEFAULT_TEST_STATUS = {
  testsBatch: true,
  testsCannabinoids: true,
  testsMoisture: true,
  testsHeavyMetals: false,
  testsPesticides: false,
  testsMicrobials: false
};

// Default edible values
export const DEFAULT_EDIBLE_VALUES = {
  dosage: 10 // 10mg THC content
};

// Export file configurations
export const EXPORT_CONFIG = {
  pdf: {
    orientation: 'portrait' as const,
    unit: 'mm' as const,
    format: 'a4' as const,
    putOnlyUsedFonts: true,
    compress: true
  },
  image: {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true
  }
};

// Batch generation limits
export const BATCH_LIMITS = {
  maxCOAs: 100,
  defaultBatchSize: 10
};

// Sample size options
export const SAMPLE_SIZE_OPTIONS = [
  { value: '1g', label: '1g' },
  { value: '2g', label: '2g' },
  { value: '2.5g', label: '2.5g' },
  { value: '3g', label: '3g' },
  { value: '3.5g', label: '3.5g' },
  { value: '3.6g', label: '3.6g' },
  { value: '4g', label: '4g' },
  { value: '5g', label: '5g' },
  { value: '7g', label: '7g' },
  { value: '10g', label: '10g' },
  { value: 'custom', label: 'Custom' }
];

// Default sample size
export const DEFAULT_SAMPLE_SIZE = '3.5g'; 
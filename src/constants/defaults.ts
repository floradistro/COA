import { ProductType, ProductConfig } from '@/types';

// Lab information defaults
export const LAB_DEFAULTS = {
  labName: 'Quantix Analytics',
  labContact: '5540 Centerview Dr Ste 204 #982095\nRaleigh, NC 27606\nsupport@quantixanalytics.com\nwww.quantixanalytics.com',
  labDirector: 'Dr. Sarah Mitchell',
  directorTitle: 'Laboratory Director',
  methodReference: 'HPLC-DAD, SOP QA-001'
};

// Client information defaults
export const CLIENT_DEFAULTS = {
  clientName: 'Flora Distribution Group LLC',
  clientAddress: '4111 E Rose Lake Dr\nCharlotte, NC 28217'
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
    defaultProfile: 'decarbed'
  },
  vaporizer: {
    sampleType: 'Vaporizer Cartridge',
    profileMultiplier: 3.0,
    defaultProfile: 'decarbed'
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
  }
};

// Product notes
export const PRODUCT_NOTES: Record<ProductType, string> = {
  flower: 'Cannabinoid analysis performed using High Performance Liquid Chromatography with Diode Array Detection (HPLC-DAD) according to validated method SOP QA-001.',
  concentrate: 'Cannabis concentrate analyzed using HPLC-DAD. Values represent cannabinoid content in concentrate form. Store in cool, dry place away from light.',
  vaporizer: 'Vaporizer cartridge oil analyzed using HPLC-DAD. High concentration cannabinoid content typical for vaporizer products. Use as directed.',
  edible: 'Cannabis edible analyzed using HPLC-DAD. Cannabinoid content per gram of product. Effects may be delayed. Start low and go slow.',
  beverage: 'Cannabis beverage analyzed using HPLC-DAD. Cannabinoid content per gram of liquid. Shake well before use. Effects may be delayed.'
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
  testsHeavyMetals: true,
  testsPesticides: true,
  testsMicrobials: true
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
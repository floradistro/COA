// Decarboxylation factor for converting THCA to THC
export const DECARB_FACTOR = 0.877;

// Cannabinoid profile ranges
export const CANNABINOID_RANGES = {
  highTHC: {
    thca: { min: 20, max: 30 },
    d9thc: { min: 0.3, max: 1.5 },
    cbga: { min: 0, max: 2 },
    cbg: { min: 0, max: 0.3 }
  },
  mediumTHC: {
    thca: { min: 10, max: 20 },
    d9thc: { min: 0.2, max: 1.0 },
    cbga: { min: 0, max: 3 },
    cbg: { min: 0, max: 0.5 }
  },
  lowTHC: {
    thca: { min: 1, max: 10 },
    d9thc: { min: 0.1, max: 0.5 },
    cbga: { min: 0, max: 4 },
    cbg: { min: 0, max: 0.8 }
  },
  hemp: {
    thca: { min: 0.1, max: 0.3 },
    d9thc: { min: 0.05, max: 0.2 },
    cbda: { min: 10, max: 20 },
    cbd: { min: 0.1, max: 1.1 },
    cbga: { min: 0, max: 1 },
    cbg: { min: 0, max: 0.2 }
  },
  decarbed: {
    thca: { min: 1, max: 5 },
    d9thc: { min: 15, max: 25 },
    cbga: { min: 0, max: 1 },
    cbg: { min: 0, max: 2 }
  }
};

// Moisture content range
export const MOISTURE_RANGE = { min: 8, max: 16 };

// LOD (Limit of Detection) and LOQ (Limit of Quantification) values
export const CANNABINOID_LIMITS = {
  THCa: { lod: 0.20, loq: 0.61 },
  'Δ9-THC': { lod: 0.15, loq: 0.45 },
  'Δ8-THC': { lod: 0.14, loq: 0.42 },
  THCV: { lod: 0.15, loq: 0.44 },
  CBDa: { lod: 0.10, loq: 0.31 },
  CBD: { lod: 0.15, loq: 0.45 },
  CBN: { lod: 0.16, loq: 0.50 },
  CBGa: { lod: 0.29, loq: 0.88 },
  CBG: { lod: 0.13, loq: 0.39 },
  CBC: { lod: 0.14, loq: 0.42 }
};

// Standard cannabinoid names
export const CANNABINOID_NAMES = {
  THCA: 'THCa',
  D9THC: 'Δ9-THC',
  D8THC: 'Δ8-THC',
  THCV: 'THCV',
  CBDA: 'CBDa',
  CBD: 'CBD',
  CBN: 'CBN',
  CBGA: 'CBGa',
  CBG: 'CBG',
  CBC: 'CBC'
} as const;

// Minor cannabinoid detection probabilities
export const MINOR_CANNABINOID_PROBABILITIES = {
  default: {
    cbd: 0.2,
    cbc: 0.15,
    cbn: 0.1,
    thcv: 0.1
  },
  hemp: {
    cbd: 1.0, // Always present in hemp
    cbc: 0.3,
    cbn: 0.2,
    thcv: 0.05
  }
};

// THCA compliance limits
export const COMPLIANCE_LIMITS = {
  totalTHC: {
    min: 0.15,
    max: 0.29
  },
  d9thcRatio: {
    min: 0.1,
    max: 0.4
  }
};

// Product type multipliers for cannabinoid content
export const PRODUCT_TYPE_MULTIPLIERS = {
  flower: 1.0,
  concentrate: 2.5,
  vaporizer: 3.0,
  edible: 0.1,
  beverage: 0.05
};

// Test result statuses
export const TEST_RESULT = {
  NOT_DETECTED: 'ND',
  BELOW_LOQ: '< LOQ',
  COMPLETE: 'Complete',
  NOT_SUBMITTED: 'Not Submitted',
  NOT_TESTED: 'Not Tested'
} as const; 
// Decarboxylation factor for converting THCA to THC
export const DECARB_FACTOR = 0.877;

// Cannabinoid profile ranges
export const CANNABINOID_RANGES = {
  highTHC: {
    thca: { min: 22, max: 30 },
    d9thc: { min: 0.05, max: 0.29 },
    cbga: { min: 0.30, max: 1.20 },
    cbg: { min: 0.05, max: 0.30 }
  },
  mediumTHC: {
    thca: { min: 15, max: 20 },
    d9thc: { min: 0.05, max: 0.29 },
    cbga: { min: 0.30, max: 1.20 },
    cbg: { min: 0.05, max: 0.30 }
  },
  lowTHC: {
    thca: { min: 0, max: 15 },
    d9thc: { min: 0.05, max: 0.29 },
    cbga: { min: 0.30, max: 1.20 },
    cbg: { min: 0.05, max: 0.30 }
  },
  hemp: {
    thca: { min: 0.1, max: 0.3 },
    d9thc: { min: 0.05, max: 0.29 },
    cbda: { min: 10, max: 20 },
    cbd: { min: 0.1, max: 1.1 },
    cbga: { min: 0.30, max: 1.20 },
    cbg: { min: 0.05, max: 0.30 }
  },
  decarbed: {
    thca: { min: 1, max: 5 },
    d9thc: { min: 0.05, max: 0.29 },
    cbga: { min: 0.30, max: 1.20 },
    cbg: { min: 0.05, max: 0.30 }
  },
  disposableVape: {
    thca: { min: 78, max: 87 },
    d9thc: { min: 0.05, max: 0.29 },
    cbga: { min: 0.10, max: 0.50 },
    cbg: { min: 0.05, max: 0.20 }
  },
  concentrate: {
    thca: { min: 80, max: 91 },
    d9thc: { min: 0.05, max: 0.29 },
    cbga: { min: 0.10, max: 0.50 },
    cbg: { min: 0.05, max: 0.20 }
  },
  // Gummies are decarbed - D9-THC is the active compound, THCA is minimal/ND
  // Based on typical gummy: 2-5g weight, 25-100mg THC = 0.5% to 5% D9-THC
  gummy: {
    thca: { min: 0, max: 0.1 },  // Very low/ND since it's decarbed
    d9thc: { min: 1, max: 5 },   // Main active compound (e.g., 100mg in 3.5g = 2.86%)
    cbga: { min: 0, max: 0.05 },
    cbg: { min: 0, max: 0.05 }
  }
};

// Moisture content range
export const MOISTURE_RANGE = { min: 8.5, max: 12.5 };

// LOD (Limit of Detection) and LOQ (Limit of Quantification) values
export const CANNABINOID_LIMITS = {
  // Default values (for flower)
  THCa: { lod: 0.10, loq: 0.30 },
  'Δ9-THC': { lod: 0.10, loq: 0.25 },
  'Δ8-THC': { lod: 0.05, loq: 0.15 }, // Using CBC/CBG values as reference
  THCV: { lod: 0.05, loq: 0.15 }, // Using CBC/CBG values as reference
  CBDa: { lod: 0.10, loq: 0.25 }, // Using CBD values as reference
  CBD: { lod: 0.10, loq: 0.25 },
  CBN: { lod: 0.01, loq: 0.05 },
  CBGa: { lod: 0.05, loq: 0.15 }, // Using CBG values as reference
  CBG: { lod: 0.05, loq: 0.15 },
  CBC: { lod: 0.05, loq: 0.15 }
};

// Separate LOD/LOQ values for edibles
export const EDIBLE_CANNABINOID_LIMITS = {
  THCa: { lod: 0.02, loq: 0.05 },
  'Δ9-THC': { lod: 0.01, loq: 0.03 },
  'Δ8-THC': { lod: 0.01, loq: 0.03 }, // Using CBC values as reference
  THCV: { lod: 0.01, loq: 0.03 }, // Using CBC values as reference
  CBDa: { lod: 0.02, loq: 0.05 }, // Using CBD values as reference
  CBD: { lod: 0.02, loq: 0.05 },
  CBN: { lod: 0.01, loq: 0.03 },
  CBGa: { lod: 0.01, loq: 0.04 }, // Using CBG values as reference
  CBG: { lod: 0.01, loq: 0.04 },
  CBC: { lod: 0.01, loq: 0.03 }
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
    cbd: 0.6,
    cbc: 0.5,
    cbn: 0.4,
    thcv: 0.3
  },
  hemp: {
    cbd: 1.0, // Always present in hemp
    cbc: 0.6,
    cbn: 0.5,
    thcv: 0.2
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
  disposable: 3.0,
  edible: 0.1,
  beverage: 0.05,
  gummy: 0.1  // Similar to edibles
};

// Test result statuses
export const TEST_RESULT = {
  NOT_DETECTED: 'ND',
  BELOW_LOQ: '< LOQ',
  COMPLETE: 'Complete',
  NOT_SUBMITTED: 'Not Submitted',
  NOT_TESTED: 'Not Tested'
} as const; 
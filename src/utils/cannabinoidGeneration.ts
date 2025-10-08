import { 
  Cannabinoid, 
  CannabinoidProfile, 
  CannabinoidProfileResult, 
  THCProfileResult, 
  MinorCannabinoidData,
  CustomRanges,
  CannabinoidResult
} from '@/types';
import { 
  DECARB_FACTOR, 
  CANNABINOID_RANGES, 
  CANNABINOID_NAMES,
  CANNABINOID_LIMITS,
  EDIBLE_CANNABINOID_LIMITS,
  TEST_RESULT,
  MOISTURE_RANGE
} from '@/constants/cannabinoids';

/**
 * Generates a random value within a range with optional seeding for uniqueness
 */
const randomInRange = (min: number, max: number, seed?: number): number => {
  if (seed !== undefined) {
    // Simple seeded random-like function for better distribution
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    const seededValue = ((a * seed + c) % m) / m;
    return min + seededValue * (max - min);
  }
  return min + Math.random() * (max - min);
};

/**
 * Calculates total THC from THCA and D9-THC
 */
export const calculateTotalTHC = (thca: number, d9thc: number): number => {
  return d9thc + (thca * DECARB_FACTOR);
};

/**
 * Calculates total CBD from CBDA and CBD
 */
export const calculateTotalCBD = (cbda: number, cbd: number): number => {
  return cbd + (cbda * DECARB_FACTOR);
};

/**
 * Converts percent weight to mg/g
 */
export const percentToMgPerG = (percent: number): number => {
  return percent * 10;
};

/**
 * Generates minor cannabinoid data with realistic ranges for high-quality flower
 */
const generateMinorCannabinoid = (
  cannabinoidName: string,
  loq: number, 
  lod: number, 
  probability: number = 0.7,
  sampleIndex?: number
): MinorCannabinoidData => {
  const random = Math.random();
  
  // Always ND cannabinoids - no exceptions, no ranges
  const alwaysNDCannabinoids = [
    'Δ8-THC', 'D8-THC', 'Delta8-THC',
    'CBD',
    'CBDV', 'CBDVa', 'CBDv', 'CBDva',
    'CBN',
    'CBL',
    'CBC',
    'THCV'
  ];
  
  if (alwaysNDCannabinoids.includes(cannabinoidName)) {
    return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  }
  
  // Add strain-based variance using sample index
  const strainVariance = sampleIndex ? Math.sin(sampleIndex * 2.7) * 0.3 : 0;
  const adjustedProbability = Math.max(0.1, Math.min(0.95, probability + strainVariance));
  
  if (random < adjustedProbability) {
    let value: number;
    
    // Use updated ranges based on specified trace cannabinoid ranges with more variance
    switch (cannabinoidName) {
      case 'CBDa':
        // Expected Range: 0.05% – 0.10%, with 20% chance of being ND
        if (Math.random() < 0.2) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        value = randomInRange(0.03, 0.15, sampleIndex ? sampleIndex * 13 : undefined);
        // Check if should be ND
        if (value < 0.05) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      case 'CBGa':
        // Expected Range: 0.30% – 1.20%, with wider variance
        // Add strain-specific patterns
        const cbgaBase = 0.30 + (sampleIndex ? (sampleIndex % 5) * 0.18 : Math.random() * 0.9);
        const cbgaVariance = (Math.random() - 0.5) * 0.4;
        value = Math.max(0.1, Math.min(1.5, cbgaBase + cbgaVariance));
        // 15% chance to be ND for some strains
        if (Math.random() < 0.15) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        // Check if should be ND
        if (value < 0.10) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      case 'CBG':
        // Expected Range: 0.05% – 0.30%, with strain variance
        // 25% chance to be ND
        if (Math.random() < 0.25) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        const cbgBase = 0.05 + (sampleIndex ? (sampleIndex % 3) * 0.08 : Math.random() * 0.25);
        const cbgVariance = (Math.random() - 0.5) * 0.15;
        value = Math.max(0.02, Math.min(0.85, cbgBase + cbgVariance));
        // Check if should be ND
        if (value < 0.05) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      case 'THCVa':
        // Expected Range: 0.05% – 0.25%, often ND
        // 40% chance to be ND
        if (Math.random() < 0.4) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        value = randomInRange(0.03, 0.35, sampleIndex ? sampleIndex * 17 : undefined);
        // Check if should be ND
        if (value < 0.05) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      case 'CBCa':
        // Expected Range: 0.10% – 0.40%, with variation
        // 30% chance to be ND
        if (Math.random() < 0.3) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        value = randomInRange(0.05, 0.5, sampleIndex ? sampleIndex * 19 : undefined);
        // Check if should be ND
        if (value < 0.10) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      default:
        // Fallback to original logic
        value = lod + Math.random() * (loq - lod) * 1.5;
    }
    
    value = parseFloat(value.toFixed(2));
    
    // Determine result based on value vs LOQ/LOD
    if (value >= loq) {
      return { value, result: 'detected' as CannabinoidResult };
    } else if (value >= lod) {
      return { value, result: TEST_RESULT.BELOW_LOQ as CannabinoidResult };
    } else {
      return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
    }
  } else {
    // Not detected
    return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  }
};

/**
 * Generates a THC profile based on profile type and optional custom ranges
 */
export const generateTHCProfile = (
  profileType: CannabinoidProfile,
  customRanges?: CustomRanges,
  sampleIndex?: number
): THCProfileResult => {
  let thca: number, d9thc: number, cbga: number, cbg: number;
  
  // Create a seed based on sample index and current time for variation but consistency
  const baseSeed = (sampleIndex || 0) * 1000 + (Date.now() % 10000);
  
  switch (profileType) {
    case 'high-thc': {
      const ranges = CANNABINOID_RANGES.highTHC;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed + 1)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed + 1);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax, baseSeed + 2)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max, baseSeed + 2);
      
      // Add more variance to CBGa and CBG
      // CBGa: Sometimes ND (15% chance), otherwise varied
      if (Math.random() < 0.15) {
        cbga = 0;
      } else {
        const cbgaBase = ranges.cbga.min + (baseSeed % 7) * 0.13;
        const cbgaVariance = (Math.random() - 0.5) * 0.35;
        cbga = Math.max(0.1, Math.min(1.5, cbgaBase + cbgaVariance));
      }
      
      // CBG: Often ND (25% chance), otherwise varied
      if (Math.random() < 0.25) {
        cbg = 0;
      } else {
        const cbgBase = ranges.cbg.min + (baseSeed % 5) * 0.05;
        const cbgVariance = (Math.random() - 0.5) * 0.12;
        cbg = Math.max(0.02, Math.min(0.45, cbgBase + cbgVariance));
      }
      break;
    }
    case 'medium-thc': {
      const ranges = CANNABINOID_RANGES.mediumTHC;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed + 1)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed + 1);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax, baseSeed + 2)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max, baseSeed + 2);
      
      // Add more variance to CBGa and CBG
      // CBGa: Sometimes ND (15% chance), otherwise varied
      if (Math.random() < 0.15) {
        cbga = 0;
      } else {
        const cbgaBase = ranges.cbga.min + (baseSeed % 7) * 0.13;
        const cbgaVariance = (Math.random() - 0.5) * 0.35;
        cbga = Math.max(0.1, Math.min(1.5, cbgaBase + cbgaVariance));
      }
      
      // CBG: Often ND (25% chance), otherwise varied
      if (Math.random() < 0.25) {
        cbg = 0;
      } else {
        const cbgBase = ranges.cbg.min + (baseSeed % 5) * 0.05;
        const cbgVariance = (Math.random() - 0.5) * 0.12;
        cbg = Math.max(0.02, Math.min(0.45, cbgBase + cbgVariance));
      }
      break;
    }
    case 'low-thc': {
      const ranges = CANNABINOID_RANGES.lowTHC;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed + 1)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed + 1);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax, baseSeed + 2)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max, baseSeed + 2);
      
      // Add more variance to CBGa and CBG
      // CBGa: Sometimes ND (15% chance), otherwise varied
      if (Math.random() < 0.15) {
        cbga = 0;
      } else {
        const cbgaBase = ranges.cbga.min + (baseSeed % 7) * 0.13;
        const cbgaVariance = (Math.random() - 0.5) * 0.35;
        cbga = Math.max(0.1, Math.min(1.5, cbgaBase + cbgaVariance));
      }
      
      // CBG: Often ND (25% chance), otherwise varied
      if (Math.random() < 0.25) {
        cbg = 0;
      } else {
        const cbgBase = ranges.cbg.min + (baseSeed % 5) * 0.05;
        const cbgVariance = (Math.random() - 0.5) * 0.12;
        cbg = Math.max(0.02, Math.min(0.45, cbgBase + cbgVariance));
      }
      break;
    }
    case 'hemp': {
      const ranges = CANNABINOID_RANGES.hemp;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed + 1)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed + 1);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax, baseSeed + 2)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max, baseSeed + 2);
      
      // Add more variance to CBGa and CBG
      // CBGa: Sometimes ND (15% chance), otherwise varied
      if (Math.random() < 0.15) {
        cbga = 0;
      } else {
        const cbgaBase = ranges.cbga.min + (baseSeed % 7) * 0.13;
        const cbgaVariance = (Math.random() - 0.5) * 0.35;
        cbga = Math.max(0.1, Math.min(1.5, cbgaBase + cbgaVariance));
      }
      
      // CBG: Often ND (25% chance), otherwise varied
      if (Math.random() < 0.25) {
        cbg = 0;
      } else {
        const cbgBase = ranges.cbg.min + (baseSeed % 5) * 0.05;
        const cbgVariance = (Math.random() - 0.5) * 0.12;
        cbg = Math.max(0.02, Math.min(0.45, cbgBase + cbgVariance));
      }
      break;
    }
    case 'decarbed': {
      const ranges = CANNABINOID_RANGES.decarbed;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed + 1)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed + 1);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax, baseSeed + 2)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max, baseSeed + 2);
      
      // Add more variance to CBGa and CBG
      // CBGa: Sometimes ND (15% chance), otherwise varied
      if (Math.random() < 0.15) {
        cbga = 0;
      } else {
        const cbgaBase = ranges.cbga.min + (baseSeed % 7) * 0.13;
        const cbgaVariance = (Math.random() - 0.5) * 0.35;
        cbga = Math.max(0.1, Math.min(1.5, cbgaBase + cbgaVariance));
      }
      
      // CBG: Often ND (25% chance), otherwise varied
      if (Math.random() < 0.25) {
        cbg = 0;
      } else {
        const cbgBase = ranges.cbg.min + (baseSeed % 5) * 0.05;
        const cbgVariance = (Math.random() - 0.5) * 0.12;
        cbg = Math.max(0.02, Math.min(0.45, cbgBase + cbgVariance));
      }
      break;
    }
    default: {
      // Default fallback - use high-thc ranges
      const ranges = CANNABINOID_RANGES.highTHC;
      thca = randomInRange(ranges.thca.min, ranges.thca.max, baseSeed + 1);
      d9thc = randomInRange(ranges.d9thc.min, ranges.d9thc.max, baseSeed + 2);
      
      // Add more variance to CBGa and CBG
      // CBGa: Sometimes ND (15% chance), otherwise varied
      if (Math.random() < 0.15) {
        cbga = 0;
      } else {
        const cbgaBase = ranges.cbga.min + (baseSeed % 7) * 0.13;
        const cbgaVariance = (Math.random() - 0.5) * 0.35;
        cbga = Math.max(0.1, Math.min(1.5, cbgaBase + cbgaVariance));
      }
      
      // CBG: Often ND (25% chance), otherwise varied
      if (Math.random() < 0.25) {
        cbg = 0;
      } else {
        const cbgBase = ranges.cbg.min + (baseSeed % 5) * 0.05;
        const cbgVariance = (Math.random() - 0.5) * 0.12;
        cbg = Math.max(0.02, Math.min(0.45, cbgBase + cbgVariance));
      }
    }
  }

  const totalTHC = calculateTotalTHC(thca, d9thc);

  return {
    thca: parseFloat(thca.toFixed(2)),
    d9thc: parseFloat(d9thc.toFixed(2)),
    cbga: parseFloat(cbga.toFixed(2)),
    cbg: parseFloat(cbg.toFixed(2)),
    totalTHC: parseFloat(totalTHC.toFixed(2))
  };
};

/**
 * Creates a cannabinoid object with all necessary properties
 */
const createCannabinoid = (
  name: string,
  percentWeight: number,
  loq: number,
  lod: number,
  result?: CannabinoidResult
): Cannabinoid => {
  const mgPerG = parseFloat((percentWeight * 10).toFixed(2));
  
  // Always ND cannabinoids - no exceptions, no ranges
  const alwaysNDCannabinoids = [
    'Δ8-THC', 'D8-THC', 'Delta8-THC',
    'CBD',
    'CBDV', 'CBDVa', 'CBDv', 'CBDva',
    'CBN',
    'CBL',
    'CBC',
    'THCV'
  ];
  
  // Keep the provided LOD and LOQ values - don't override them
  let finalResult: CannabinoidResult;
  
  if (alwaysNDCannabinoids.includes(name)) {
    finalResult = TEST_RESULT.NOT_DETECTED as CannabinoidResult;
  } else if (name === 'Δ9-THC' && percentWeight > 0) {
    // For D9-THC, always show the actual value if it's above 0
    finalResult = 'detected' as CannabinoidResult;
  } else {
    finalResult = result || (
      percentWeight === 0 ? TEST_RESULT.NOT_DETECTED as CannabinoidResult :
      percentWeight < loq ? TEST_RESULT.BELOW_LOQ as CannabinoidResult :
      'detected' as CannabinoidResult
    );
  }

  return {
    name,
    percentWeight,
    mgPerG,
    loq: loq,
    lod: lod,
    result: finalResult
  };
};

/**
 * Generates a complete cannabinoid profile
 */
export const generateFullCannabinoidProfile = (
  profileType: CannabinoidProfile,
  customRanges?: CustomRanges,
  sampleIndex?: number
): CannabinoidProfileResult => {
  // Use the base profile's values for most cannabinoids, but randomize the selected minor ones
  const baseProfile = generateTHCProfile(profileType, customRanges, sampleIndex);
  
  // Generate random LOD/LOQ values for each cannabinoid
  const thcaLimits = generateRandomLimits(CANNABINOID_NAMES.THCA);
  const d9thcLimits = generateRandomLimits(CANNABINOID_NAMES.D9THC);
  const d8thcLimits = generateRandomLimits(CANNABINOID_NAMES.D8THC);
  const thcvLimits = generateRandomLimits(CANNABINOID_NAMES.THCV);
  const cbdaLimits = generateRandomLimits(CANNABINOID_NAMES.CBDA);
  const cbdLimits = generateRandomLimits(CANNABINOID_NAMES.CBD);
  const cbnLimits = generateRandomLimits(CANNABINOID_NAMES.CBN);
  const cbgaLimits = generateRandomLimits(CANNABINOID_NAMES.CBGA);
  const cbgLimits = generateRandomLimits(CANNABINOID_NAMES.CBG);
  const cbcLimits = generateRandomLimits(CANNABINOID_NAMES.CBC);
  
  // Always include CBDa if profileType is hemp
  let cbdaData: MinorCannabinoidData;
  
  if (profileType === 'hemp') {
    // For hemp profiles, CBDa should be detected
    cbdaData = generateMinorCannabinoid('CBDa', cbdaLimits.loq, cbdaLimits.lod, 0.9, sampleIndex);
  } else {
    // For other profiles, CBDa may or may not be detected
    cbdaData = generateMinorCannabinoid('CBDa', cbdaLimits.loq, cbdaLimits.lod, 0.9, sampleIndex);
  }
  
  // Generate other minor cannabinoids - always ND now
  const d8thcData = generateMinorCannabinoid('D8-THC', d8thcLimits.loq, d8thcLimits.lod, 0.7, sampleIndex);
  const thcvData = generateMinorCannabinoid('THCV', thcvLimits.loq, thcvLimits.lod, 0.7, sampleIndex);
  const cbdData = generateMinorCannabinoid('CBD', cbdLimits.loq, cbdLimits.lod, 0.7, sampleIndex);
  const cbnData = generateMinorCannabinoid('CBN', cbnLimits.loq, cbnLimits.lod, 0.7, sampleIndex);  
  const cbcData = generateMinorCannabinoid('CBC', cbcLimits.loq, cbcLimits.lod, 0.7, sampleIndex);

  // Create cannabinoid array - D9-THC will always show its value due to the createCannabinoid logic
  const cannabinoids = [
    createCannabinoid(CANNABINOID_NAMES.THCA, baseProfile.thca, thcaLimits.loq, thcaLimits.lod),
    createCannabinoid(CANNABINOID_NAMES.D9THC, baseProfile.d9thc, d9thcLimits.loq, d9thcLimits.lod),
    createCannabinoid(CANNABINOID_NAMES.D8THC, d8thcData.value, d8thcLimits.loq, d8thcLimits.lod, d8thcData.result),
    createCannabinoid(CANNABINOID_NAMES.THCV, thcvData.value, thcvLimits.loq, thcvLimits.lod, thcvData.result),
    createCannabinoid(CANNABINOID_NAMES.CBDA, cbdaData.value, cbdaLimits.loq, cbdaLimits.lod, cbdaData.result),
    createCannabinoid(CANNABINOID_NAMES.CBD, cbdData.value, cbdLimits.loq, cbdLimits.lod, cbdData.result),
    createCannabinoid(CANNABINOID_NAMES.CBN, cbnData.value, cbnLimits.loq, cbnLimits.lod, cbnData.result),
    createCannabinoid(
      CANNABINOID_NAMES.CBGA, 
      baseProfile.cbga, 
      cbgaLimits.loq, 
      cbgaLimits.lod,
      baseProfile.cbga > cbgaLimits.loq ? 'detected' as CannabinoidResult : 
      baseProfile.cbga > cbgaLimits.lod ? TEST_RESULT.BELOW_LOQ as CannabinoidResult : 
      TEST_RESULT.NOT_DETECTED as CannabinoidResult
    ),
    createCannabinoid(
      CANNABINOID_NAMES.CBG, 
      baseProfile.cbg, 
      cbgLimits.loq, 
      cbgLimits.lod,
      baseProfile.cbg > cbgLimits.loq ? 'detected' as CannabinoidResult : 
      baseProfile.cbg > cbgLimits.lod ? TEST_RESULT.BELOW_LOQ as CannabinoidResult : 
      TEST_RESULT.NOT_DETECTED as CannabinoidResult
    ),
    createCannabinoid(CANNABINOID_NAMES.CBC, cbcData.value, cbcLimits.loq, cbcLimits.lod, cbcData.result),
  ];

  // Calculate totals using the formula
  const totalTHC = parseFloat(calculateTotalTHC(baseProfile.thca, baseProfile.d9thc).toFixed(2));
  const totalCBD = parseFloat(calculateTotalCBD(cbdaData.value, cbdData.value).toFixed(2));

  // Calculate total cannabinoids - only count detected cannabinoids (matching validation logic)
  const totalCannabinoids = parseFloat(cannabinoids.reduce((sum, cannabinoid) => {
    // Only count cannabinoids that are detected (not ND or < LOQ)
    if (cannabinoid.result !== 'ND' && cannabinoid.result !== '< LOQ') {
      return sum + cannabinoid.percentWeight;
    }
    return sum;
  }, 0).toFixed(2));

  return {
    cannabinoids,
    totalTHC,
    totalCBD,
    totalCannabinoids
  };
};

/**
 * Generates a compliance-friendly cannabinoid profile (D9 THC < 0.3%, THCA respects selected profile)
 */
export const generateTHCAComplianceProfile = (
  profileType: CannabinoidProfile = 'high-thc',
  customRanges?: CustomRanges,
  sampleIndex?: number
): CannabinoidProfileResult => {
  // Always keep D9 THC under 0.3% for compliance (between 0.05% and 0.29%)
  const d9thc = parseFloat(randomInRange(0.05, 0.29).toFixed(2));
  
  // Generate random LOD/LOQ values for each cannabinoid
  const thcaLimits = generateRandomLimits(CANNABINOID_NAMES.THCA);
  const d9thcLimits = generateRandomLimits(CANNABINOID_NAMES.D9THC);
  const d8thcLimits = generateRandomLimits(CANNABINOID_NAMES.D8THC);
  const thcvLimits = generateRandomLimits(CANNABINOID_NAMES.THCV);
  const cbdaLimits = generateRandomLimits(CANNABINOID_NAMES.CBDA);
  const cbdLimits = generateRandomLimits(CANNABINOID_NAMES.CBD);
  const cbnLimits = generateRandomLimits(CANNABINOID_NAMES.CBN);
  const cbgaLimits = generateRandomLimits(CANNABINOID_NAMES.CBGA);
  const cbgLimits = generateRandomLimits(CANNABINOID_NAMES.CBG);
  const cbcLimits = generateRandomLimits(CANNABINOID_NAMES.CBC);
  
  // Get THCA range from selected profile
  let thca: number;
  switch (profileType) {
    case 'high-thc': {
      const ranges = CANNABINOID_RANGES.highTHC;
      const baseSeed = (sampleIndex || 0) * 1000 + (Date.now() % 10000);
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed);
      break;
    }
    case 'medium-thc': {
      const ranges = CANNABINOID_RANGES.mediumTHC;
      const baseSeed = (sampleIndex || 0) * 1000 + (Date.now() % 10000);
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed);
      break;
    }
    case 'low-thc': {
      const ranges = CANNABINOID_RANGES.lowTHC;
      const baseSeed = (sampleIndex || 0) * 1000 + (Date.now() % 10000);
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed);
      break;
    }
    case 'hemp': {
      const ranges = CANNABINOID_RANGES.hemp;
      const baseSeed = (sampleIndex || 0) * 1000 + (Date.now() % 10000);
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed);
      break;
    }
    case 'decarbed': {
      const ranges = CANNABINOID_RANGES.decarbed;
      const baseSeed = (sampleIndex || 0) * 1000 + (Date.now() % 10000);
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax, baseSeed)
        : randomInRange(ranges.thca.min, ranges.thca.max, baseSeed);
      break;
    }
    default: {
      // Default to high-thc ranges
      const ranges = CANNABINOID_RANGES.highTHC;
      const baseSeed = (sampleIndex || 0) * 1000 + (Date.now() % 10000);
      thca = randomInRange(ranges.thca.min, ranges.thca.max, baseSeed);
    }
  }
  
  thca = parseFloat(thca.toFixed(2));
  
  // Calculate total THC (this will be > 0.3% due to THCA content, but D9 is compliant)
  const totalTHC = calculateTotalTHC(thca, d9thc);
  
  // Add typical cannabinoids based on profile
  let cbd: number, cbda: number, cbg: number, cbga: number;
  
  if (profileType === 'hemp') {
    const ranges = CANNABINOID_RANGES.hemp;
    cbd = 0; // Always ND now
    cbda = parseFloat(randomInRange(ranges.cbda!.min, ranges.cbda!.max).toFixed(2));
    cbg = parseFloat(randomInRange(ranges.cbg.min, ranges.cbg.max).toFixed(2));
    cbga = parseFloat(randomInRange(ranges.cbga.min, ranges.cbga.max).toFixed(2));
  } else {
    // Generate minor cannabinoids with variation
    cbd = 0; // Always ND now
    cbda = parseFloat(randomInRange(0.05, 0.10).toFixed(2)); // Use the trace range
    
    // CBG with more variance (25% chance to be ND)
    if (Math.random() < 0.25) {
      cbg = 0;
    } else {
      const cbgBase = 0.05 + ((sampleIndex || 0) % 5) * 0.05;
      const cbgVariance = (Math.random() - 0.5) * 0.12;
      cbg = parseFloat(Math.max(0.02, Math.min(0.45, cbgBase + cbgVariance)).toFixed(2));
    }
    
    // CBGa with more variance (15% chance to be ND)
    if (Math.random() < 0.15) {
      cbga = 0;
    } else {
      const cbgaBase = 0.30 + ((sampleIndex || 0) % 7) * 0.13;
      const cbgaVariance = (Math.random() - 0.5) * 0.35;
      cbga = parseFloat(Math.max(0.1, Math.min(1.5, cbgaBase + cbgaVariance)).toFixed(2));
    }
  }
  
  // All these are now always ND
  const cbcData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  const cbnData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  const thcvData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  
  // Handle Δ8-THC - always ND now
  const d8thcData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };

  // Create cannabinoid array
  const cannabinoids = [
    createCannabinoid(CANNABINOID_NAMES.THCA, thca, thcaLimits.loq, thcaLimits.lod),
    createCannabinoid(CANNABINOID_NAMES.D9THC, d9thc, d9thcLimits.loq, d9thcLimits.lod),
    createCannabinoid(CANNABINOID_NAMES.D8THC, d8thcData.value, d8thcLimits.loq, d8thcLimits.lod, d8thcData.result),
    createCannabinoid(CANNABINOID_NAMES.THCV, thcvData.value, thcvLimits.loq, thcvLimits.lod, thcvData.result),
    createCannabinoid(CANNABINOID_NAMES.CBDA, cbda, cbdaLimits.loq, cbdaLimits.lod),
    createCannabinoid(CANNABINOID_NAMES.CBD, cbd, cbdLimits.loq, cbdLimits.lod),
    createCannabinoid(CANNABINOID_NAMES.CBN, cbnData.value, cbnLimits.loq, cbnLimits.lod, cbnData.result),
    createCannabinoid(CANNABINOID_NAMES.CBGA, cbga, cbgaLimits.loq, cbgaLimits.lod),
    createCannabinoid(CANNABINOID_NAMES.CBG, cbg, cbgLimits.loq, cbgLimits.lod),
    createCannabinoid(CANNABINOID_NAMES.CBC, cbcData.value, cbcLimits.loq, cbcLimits.lod, cbcData.result),
  ];

  // Calculate total cannabinoids - only count detected cannabinoids (matching validation logic)
  const totalCannabinoids = parseFloat(cannabinoids.reduce((sum, cannabinoid) => {
    // Only count cannabinoids that are detected (not ND or < LOQ)
    if (cannabinoid.result !== 'ND' && cannabinoid.result !== '< LOQ') {
      return sum + cannabinoid.percentWeight;
    }
    return sum;
  }, 0).toFixed(2));

  return {
    cannabinoids,
    totalTHC: parseFloat(totalTHC.toFixed(2)),
    totalCBD: parseFloat(calculateTotalCBD(cbda, cbd).toFixed(2)),
    totalCannabinoids
  };
};

/**
 * Generates random moisture content with sample index for uniqueness
 * @param sampleIndex Optional sample index for batch generation
 */
export const generateMoistureContent = (sampleIndex?: number): number => {
  const indexOffset = sampleIndex || 0;
  const variation = Math.sin((indexOffset + Date.now()) * 0.001) * 0.5;
  return parseFloat((randomInRange(MOISTURE_RANGE.min, MOISTURE_RANGE.max) + variation).toFixed(2));
};

/**
 * Calculates sum of detected cannabinoids
 */
export const calculateSumOfCannabinoids = (cannabinoids: Cannabinoid[]): number => {
  const sum = cannabinoids.reduce((total, cannabinoid) => {
    if (cannabinoid.result !== TEST_RESULT.NOT_DETECTED && 
        cannabinoid.result !== TEST_RESULT.BELOW_LOQ && 
        cannabinoid.percentWeight > 0) {
      return total + cannabinoid.percentWeight;
    }
    return total;
  }, 0);
  return parseFloat(sum.toFixed(2));
};

/**
 * Returns fixed LOD and LOQ values for flower products
 * No longer generates random values - uses fixed values from CANNABINOID_LIMITS
 */
const generateRandomLimits = (cannabinoidName: string): { lod: number; loq: number } => {
  // Use fixed values from CANNABINOID_LIMITS for flower products
  const limits = CANNABINOID_LIMITS[cannabinoidName as keyof typeof CANNABINOID_LIMITS];
  
  if (limits) {
    return { lod: limits.lod, loq: limits.loq };
  }
  
  // Fallback values if cannabinoid not found
  return { lod: 0.05, loq: 0.15 };
};

/**
 * Generates cannabinoid profile specifically for edible products
 * Uses the correct formula: (THC mg / Sample Size in mg) × 100
 * Only D9-THC is detected, calculated from THC content and sample size
 * All other cannabinoids are set to ND
 */
export const generateEdibleCannabinoidProfile = (
  thcContentMg: number,
  sampleSize: string
): CannabinoidProfileResult => {
  // Parse sample size to get weight in mg
  // Sample size formats: "3.5g", "1000mg", "2.5 g", etc.
  const sampleSizeMg = parseSampleSizeToMg(sampleSize);
  
  // Calculate D9-THC percentage using the correct formula
  // (THC mg / Sample Size mg) × 100
  const d9thcPercent = (thcContentMg / sampleSizeMg) * 100;
  
  // For edibles, only D9-THC is detected, all others are ND
  const cannabinoids: Cannabinoid[] = Object.values(CANNABINOID_NAMES).map(name => {
    if (name === 'Δ9-THC') {
      return createCannabinoid(
        name,
        parseFloat(d9thcPercent.toFixed(3)),
        EDIBLE_CANNABINOID_LIMITS[name].loq,
        EDIBLE_CANNABINOID_LIMITS[name].lod
      );
    }
    
    // All other cannabinoids are not detected in edibles
    // Use edible-specific LOD/LOQ values
    const limits = EDIBLE_CANNABINOID_LIMITS[name as keyof typeof EDIBLE_CANNABINOID_LIMITS];
    return createCannabinoid(
      name,
      0,
      limits?.loq || 0.01,
      limits?.lod || 0.003,
      TEST_RESULT.NOT_DETECTED as CannabinoidResult
    );
  });
  
  // Calculate totals (only D9-THC contributes)
  const totalTHC = d9thcPercent; // No THCA conversion needed
  const totalCBD = 0; // No CBD/CBDA in edibles
  const totalCannabinoids = d9thcPercent; // Only D9-THC
  
  return {
    cannabinoids,
    totalTHC: parseFloat(totalTHC.toFixed(3)),
    totalCBD: parseFloat(totalCBD.toFixed(3)),
    totalCannabinoids: parseFloat(totalCannabinoids.toFixed(3))
  };
};

/**
 * Parses sample size string to milligrams
 * Handles formats like "3.5g", "1000mg", "2.5 g", etc.
 */
const parseSampleSizeToMg = (sampleSize: string): number => {
  // Remove whitespace and convert to lowercase
  const cleaned = sampleSize.trim().replace(/\s+/g, '').toLowerCase();
  
  // Try to extract number and unit - more flexible regex
  const match = cleaned.match(/^([\d.]+)(mg|g)?$/);
  
  if (!match) {
    // Default fallback if parsing fails
    console.warn(`Could not parse sample size: ${sampleSize}, using default 3500mg`);
    return 3500; // 3.5g default
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'g'; // Default to grams if no unit specified
  
  let result: number;
  if (unit === 'mg') {
    result = value;
  } else { // Assume grams for 'g' or no unit
    result = value * 1000; // Convert grams to milligrams
  }
  
  return result;
}; 
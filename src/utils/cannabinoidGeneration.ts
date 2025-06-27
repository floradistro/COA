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
  
  if (random < probability) {
    let value: number;
    
    // Use updated ranges based on specified trace cannabinoid ranges
    switch (cannabinoidName) {
      case 'CBDa':
        // Expected Range: 0.05% – 0.10%, Show as ND if < 0.05% (but this seems low, keeping reasonable range)
        value = randomInRange(0.05, 0.10);
        // Check if should be ND
        if (value < 0.05) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      case 'CBGa':
        // Expected Range: 0.30% – 1.20%, Show as ND if < 0.10%
        value = randomInRange(0.30, 1.20);
        // Check if should be ND
        if (value < 0.10) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      case 'CBG':
        // Expected Range: 0.05% – 0.30%, Show as ND if < 0.05%
        value = randomInRange(0.05, 0.30);
        // Check if should be ND
        if (value < 0.05) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      case 'THCVa':
        // Expected Range: 0.05% – 0.25%, Show as ND if < 0.05%
        value = randomInRange(0.05, 0.25);
        // Check if should be ND
        if (value < 0.05) {
          return { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
        }
        break;
      case 'CBCa':
        // Expected Range: 0.10% – 0.40%, Show as ND if < 0.10%
        value = randomInRange(0.10, 0.40);
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
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max, baseSeed + 3);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max, baseSeed + 4);
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
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max, baseSeed + 3);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max, baseSeed + 4);
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
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max, baseSeed + 3);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max, baseSeed + 4);
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
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max, baseSeed + 3);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max, baseSeed + 4);
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
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max, baseSeed + 3);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max, baseSeed + 4);
      break;
    }
    default: {
      // Default fallback - use high-thc ranges
      const ranges = CANNABINOID_RANGES.highTHC;
      thca = randomInRange(ranges.thca.min, ranges.thca.max, baseSeed + 1);
      d9thc = randomInRange(ranges.d9thc.min, ranges.d9thc.max, baseSeed + 2);
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max, baseSeed + 3);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max, baseSeed + 4);
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
  
  // For D9-THC, always show the actual value if it's above 0
  let finalResult: CannabinoidResult;
  if (name === 'Δ9-THC' && percentWeight > 0) {
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
    loq,
    lod,
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
  const baseProfile = generateTHCProfile(profileType, customRanges, sampleIndex);
  
  // Generate random LOD/LOQ values for each cannabinoid
  const thcaLimits = generateRandomLimits(CANNABINOID_NAMES.THCA, sampleIndex);
  const d9thcLimits = generateRandomLimits(CANNABINOID_NAMES.D9THC, sampleIndex);
  const d8thcLimits = generateRandomLimits(CANNABINOID_NAMES.D8THC, sampleIndex);
  const thcvLimits = generateRandomLimits(CANNABINOID_NAMES.THCV, sampleIndex);
  const cbdaLimits = generateRandomLimits(CANNABINOID_NAMES.CBDA, sampleIndex);
  const cbdLimits = generateRandomLimits(CANNABINOID_NAMES.CBD, sampleIndex);
  const cbnLimits = generateRandomLimits(CANNABINOID_NAMES.CBN, sampleIndex);
  const cbgaLimits = generateRandomLimits(CANNABINOID_NAMES.CBGA, sampleIndex);
  const cbgLimits = generateRandomLimits(CANNABINOID_NAMES.CBG, sampleIndex);
  const cbcLimits = generateRandomLimits(CANNABINOID_NAMES.CBC, sampleIndex);
  
  // Randomly select 1-3 minor cannabinoids to show - excluding always ND cannabinoids
  const minorCannabinoidCount = Math.floor(Math.random() * 3) + 1;
  const availableMinors = ['CBDa']; // Only CBDa is allowed to be detected from the trace cannabinoids
  const selectedMinors = new Set<string>();
  
  // Always include CBDa as it's the only one that can be detected
  selectedMinors.add('CBDa');

  // Generate minor cannabinoids - all always-ND cannabinoids will return ND
  let cbdData: MinorCannabinoidData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  let cbdaData: MinorCannabinoidData;
  
  if (profileType === 'hemp') {
    // Even hemp profiles - CBD is always ND now, but CBDa can still be detected
    const ranges = CANNABINOID_RANGES.hemp;
    const cbda = parseFloat(randomInRange(ranges.cbda!.min, ranges.cbda!.max).toFixed(2));
    cbdData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult }; // Always ND
    cbdaData = { value: cbda, result: 'detected' as CannabinoidResult };
  } else {
    cbdData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult }; // Always ND
    cbdaData = generateMinorCannabinoid('CBDa', cbdaLimits.loq, cbdaLimits.lod, 0.9, sampleIndex);
  }
  
  // All these are now always ND
  const cbcData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  const cbnData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  const thcvData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };
  
  // Handle Δ8-THC - always ND now
  const d8thcData = { value: 0, result: TEST_RESULT.NOT_DETECTED as CannabinoidResult };

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
  const thcaLimits = generateRandomLimits(CANNABINOID_NAMES.THCA, sampleIndex);
  const d9thcLimits = generateRandomLimits(CANNABINOID_NAMES.D9THC, sampleIndex);
  const d8thcLimits = generateRandomLimits(CANNABINOID_NAMES.D8THC, sampleIndex);
  const thcvLimits = generateRandomLimits(CANNABINOID_NAMES.THCV, sampleIndex);
  const cbdaLimits = generateRandomLimits(CANNABINOID_NAMES.CBDA, sampleIndex);
  const cbdLimits = generateRandomLimits(CANNABINOID_NAMES.CBD, sampleIndex);
  const cbnLimits = generateRandomLimits(CANNABINOID_NAMES.CBN, sampleIndex);
  const cbgaLimits = generateRandomLimits(CANNABINOID_NAMES.CBGA, sampleIndex);
  const cbgLimits = generateRandomLimits(CANNABINOID_NAMES.CBG, sampleIndex);
  const cbcLimits = generateRandomLimits(CANNABINOID_NAMES.CBC, sampleIndex);
  
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
  
  // Only CBDa is allowed to be detected from trace cannabinoids
  const selectedMinors = new Set<string>(['CBDa']);
  
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
    cbg = parseFloat(randomInRange(0.05, 0.30).toFixed(2)); // Use the trace range
    cbga = parseFloat(randomInRange(0.30, 1.20).toFixed(2)); // Use the trace range
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
 * Generates randomized LOD and LOQ values within realistic ranges with more variation
 * Enhanced with sample index for better entropy across batch generation
 */
const generateRandomLimits = (cannabinoidName: string, sampleIndex?: number): { lod: number; loq: number } => {
  // Define realistic ranges for LOD/LOQ based on cannabinoid type with more variation
  const limitRanges: Record<string, { lodMin: number; lodMax: number; loqMin: number; loqMax: number }> = {
    'THCa': { lodMin: 0.12, lodMax: 0.28, loqMin: 0.40, loqMax: 0.85 },
    'Δ9-THC': { lodMin: 0.08, lodMax: 0.22, loqMin: 0.30, loqMax: 0.65 },
    'Δ8-THC': { lodMin: 0.09, lodMax: 0.20, loqMin: 0.32, loqMax: 0.58 },
    'THCV': { lodMin: 0.08, lodMax: 0.23, loqMin: 0.33, loqMax: 0.62 },
    'CBDa': { lodMin: 0.06, lodMax: 0.18, loqMin: 0.22, loqMax: 0.45 },
    'CBD': { lodMin: 0.08, lodMax: 0.24, loqMin: 0.32, loqMax: 0.60 },
    'CBN': { lodMin: 0.10, lodMax: 0.25, loqMin: 0.38, loqMax: 0.68 },
    'CBGa': { lodMin: 0.18, lodMax: 0.40, loqMin: 0.65, loqMax: 1.10 },
    'CBG': { lodMin: 0.08, lodMax: 0.21, loqMin: 0.28, loqMax: 0.55 },
    'CBC': { lodMin: 0.09, lodMax: 0.20, loqMin: 0.32, loqMax: 0.56 }
  };
  
  const range = limitRanges[cannabinoidName] || { lodMin: 0.08, lodMax: 0.25, loqMin: 0.28, loqMax: 0.70 };
  
  // Add more variation based on cannabinoid name hash and sample index
  const nameHash = cannabinoidName.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0);
  const indexOffset = sampleIndex || 0;
  const seed = (nameHash + indexOffset + Date.now()) % 1000;
  
  const lodVariation = (Math.sin(seed * 0.01) * 0.03);
  const loqVariation = (Math.cos(seed * 0.01) * 0.04);
  
  const lod = parseFloat((randomInRange(range.lodMin, range.lodMax) + lodVariation).toFixed(2));
  const loq = parseFloat((randomInRange(range.loqMin, range.loqMax) + loqVariation).toFixed(2));
  
  return { lod, loq };
}; 
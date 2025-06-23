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
  CANNABINOID_LIMITS, 
  CANNABINOID_NAMES,
  MINOR_CANNABINOID_PROBABILITIES,
  TEST_RESULT,
  COMPLIANCE_LIMITS,
  MOISTURE_RANGE
} from '@/constants/cannabinoids';

/**
 * Generates a random value within a range
 */
const randomInRange = (min: number, max: number): number => {
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
 * Generates minor cannabinoid data with detection probabilities
 */
const generateMinorCannabinoid = (
  loq: number, 
  lod: number, 
  probability: number = 0.3
): MinorCannabinoidData => {
  const random = Math.random();
  
  if (random < probability) {
    // Detected - value between LOD and slightly above LOQ
    const value = lod + Math.random() * (loq - lod) * 1.5;
    if (value < loq) {
      return { value: 0, result: TEST_RESULT.BELOW_LOQ };
    } else {
      return { value: parseFloat(value.toFixed(2)), result: 'detected' as CannabinoidResult };
    }
  } else {
    // Not detected
    return { value: 0, result: TEST_RESULT.NOT_DETECTED };
  }
};

/**
 * Generates a THC profile based on profile type and optional custom ranges
 */
export const generateTHCProfile = (
  profileType: CannabinoidProfile,
  customRanges?: CustomRanges
): THCProfileResult => {
  let thca: number, d9thc: number, cbga: number, cbg: number;
  
  switch (profileType) {
    case 'high-thc': {
      const ranges = CANNABINOID_RANGES.highTHC;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax)
        : randomInRange(ranges.thca.min, ranges.thca.max);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max);
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max);
      break;
    }
    case 'medium-thc': {
      const ranges = CANNABINOID_RANGES.mediumTHC;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax)
        : randomInRange(ranges.thca.min, ranges.thca.max);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max);
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max);
      break;
    }
    case 'low-thc': {
      const ranges = CANNABINOID_RANGES.lowTHC;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax)
        : randomInRange(ranges.thca.min, ranges.thca.max);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max);
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max);
      break;
    }
    case 'hemp': {
      const ranges = CANNABINOID_RANGES.hemp;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax)
        : randomInRange(ranges.thca.min, ranges.thca.max);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max);
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max);
      break;
    }
    case 'decarbed': {
      const ranges = CANNABINOID_RANGES.decarbed;
      thca = customRanges 
        ? randomInRange(customRanges.thcaMin, customRanges.thcaMax)
        : randomInRange(ranges.thca.min, ranges.thca.max);
      d9thc = customRanges
        ? randomInRange(customRanges.d9thcMin, customRanges.d9thcMax)
        : randomInRange(ranges.d9thc.min, ranges.d9thc.max);
      cbga = randomInRange(ranges.cbga.min, ranges.cbga.max);
      cbg = randomInRange(ranges.cbg.min, ranges.cbg.max);
      break;
    }
    default: {
      // Default fallback
      thca = randomInRange(15, 25);
      d9thc = randomInRange(0.2, 1.2);
      cbga = randomInRange(0, 2);
      cbg = randomInRange(0, 0.4);
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
  const finalResult = result || (
    percentWeight === 0 ? TEST_RESULT.NOT_DETECTED :
    percentWeight < loq ? TEST_RESULT.BELOW_LOQ :
    'detected'
  ) as CannabinoidResult;

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
  customRanges?: CustomRanges
): CannabinoidProfileResult => {
  const baseProfile = generateTHCProfile(profileType, customRanges);
  
  // Determine minor cannabinoid probabilities
  const probabilities = profileType === 'hemp' 
    ? MINOR_CANNABINOID_PROBABILITIES.hemp 
    : MINOR_CANNABINOID_PROBABILITIES.default;

  // Generate minor cannabinoids
  let cbdData: MinorCannabinoidData;
  let cbdaData: MinorCannabinoidData;
  
  if (profileType === 'hemp') {
    // Hemp always has CBD/CBDa
    const ranges = CANNABINOID_RANGES.hemp;
    const cbd = parseFloat(randomInRange(ranges.cbd!.min, ranges.cbd!.max).toFixed(2));
    const cbda = parseFloat(randomInRange(ranges.cbda!.min, ranges.cbda!.max).toFixed(2));
    cbdData = { value: cbd, result: 'detected' as CannabinoidResult };
    cbdaData = { value: cbda, result: 'detected' as CannabinoidResult };
  } else {
    const cbdLimits = CANNABINOID_LIMITS.CBD;
    const cbdaLimits = CANNABINOID_LIMITS.CBDa;
    cbdData = generateMinorCannabinoid(cbdLimits.loq, cbdLimits.lod, probabilities.cbd);
    cbdaData = generateMinorCannabinoid(cbdaLimits.loq, cbdaLimits.lod, probabilities.cbd);
  }
  
  const cbcLimits = CANNABINOID_LIMITS.CBC;
  const cbnLimits = CANNABINOID_LIMITS.CBN;
  const thcvLimits = CANNABINOID_LIMITS.THCV;
  
  const cbcData = generateMinorCannabinoid(cbcLimits.loq, cbcLimits.lod, probabilities.cbc);
  const cbnData = generateMinorCannabinoid(cbnLimits.loq, cbnLimits.lod, probabilities.cbn);
  const thcvData = generateMinorCannabinoid(thcvLimits.loq, thcvLimits.lod, probabilities.thcv);

  // Create cannabinoid array
  const cannabinoids = [
    createCannabinoid(CANNABINOID_NAMES.THCA, baseProfile.thca, CANNABINOID_LIMITS.THCa.loq, CANNABINOID_LIMITS.THCa.lod),
    createCannabinoid(CANNABINOID_NAMES.D9THC, baseProfile.d9thc, CANNABINOID_LIMITS['Δ9-THC'].loq, CANNABINOID_LIMITS['Δ9-THC'].lod),
    createCannabinoid(CANNABINOID_NAMES.D8THC, 0, CANNABINOID_LIMITS['Δ8-THC'].loq, CANNABINOID_LIMITS['Δ8-THC'].lod),
    createCannabinoid(CANNABINOID_NAMES.THCV, thcvData.value, CANNABINOID_LIMITS.THCV.loq, CANNABINOID_LIMITS.THCV.lod, thcvData.result),
    createCannabinoid(CANNABINOID_NAMES.CBDA, cbdaData.value, CANNABINOID_LIMITS.CBDa.loq, CANNABINOID_LIMITS.CBDa.lod, cbdaData.result),
    createCannabinoid(CANNABINOID_NAMES.CBD, cbdData.value, CANNABINOID_LIMITS.CBD.loq, CANNABINOID_LIMITS.CBD.lod, cbdData.result),
    createCannabinoid(CANNABINOID_NAMES.CBN, cbnData.value, CANNABINOID_LIMITS.CBN.loq, CANNABINOID_LIMITS.CBN.lod, cbnData.result),
    createCannabinoid(
      CANNABINOID_NAMES.CBGA, 
      baseProfile.cbga, 
      CANNABINOID_LIMITS.CBGa.loq, 
      CANNABINOID_LIMITS.CBGa.lod,
      baseProfile.cbga > CANNABINOID_LIMITS.CBGa.loq ? 'detected' as CannabinoidResult : 
      baseProfile.cbga > CANNABINOID_LIMITS.CBGa.lod ? TEST_RESULT.BELOW_LOQ : 
      TEST_RESULT.NOT_DETECTED
    ),
    createCannabinoid(
      CANNABINOID_NAMES.CBG, 
      baseProfile.cbg, 
      CANNABINOID_LIMITS.CBG.loq, 
      CANNABINOID_LIMITS.CBG.lod,
      baseProfile.cbg > CANNABINOID_LIMITS.CBG.loq ? 'detected' as CannabinoidResult : 
      baseProfile.cbg > CANNABINOID_LIMITS.CBG.lod ? TEST_RESULT.BELOW_LOQ : 
      TEST_RESULT.NOT_DETECTED
    ),
    createCannabinoid(CANNABINOID_NAMES.CBC, cbcData.value, CANNABINOID_LIMITS.CBC.loq, CANNABINOID_LIMITS.CBC.lod, cbcData.result),
  ];

  // Calculate totals
  const totalCBD = profileType === 'hemp' 
    ? parseFloat(calculateTotalCBD(cbdaData.value, cbdData.value).toFixed(2))
    : 0;

  const totalCannabinoids = parseFloat((
    baseProfile.thca + 
    baseProfile.d9thc + 
    baseProfile.cbga + 
    baseProfile.cbg + 
    cbdData.value + 
    cbdaData.value + 
    cbcData.value + 
    cbnData.value + 
    thcvData.value
  ).toFixed(2));

  return {
    cannabinoids,
    totalTHC: baseProfile.totalTHC,
    totalCBD,
    totalCannabinoids
  };
};

/**
 * Generates a compliance-friendly cannabinoid profile (total THC < 0.3%)
 */
export const generateTHCAComplianceProfile = (): CannabinoidProfileResult => {
  // Generate a random total THC between safe limits
  const targetTotalTHC = randomInRange(COMPLIANCE_LIMITS.totalTHC.min, COMPLIANCE_LIMITS.totalTHC.max);
  
  // Randomly split between THCA and D9-THC
  const d9thcRatio = randomInRange(COMPLIANCE_LIMITS.d9thcRatio.min, COMPLIANCE_LIMITS.d9thcRatio.max);
  const d9thc = parseFloat((targetTotalTHC * d9thcRatio).toFixed(2));
  
  // Calculate THCA from remaining total THC
  const remainingTHC = targetTotalTHC - d9thc;
  const thca = parseFloat((remainingTHC / DECARB_FACTOR).toFixed(2));
  
  // Add typical hemp cannabinoids
  const cbd = parseFloat(randomInRange(5, 20).toFixed(2)); // 5-20% CBD typical for hemp
  const cbda = parseFloat(randomInRange(2, 10).toFixed(2)); // 2-10% CBDa
  const cbg = parseFloat(randomInRange(0, 0.5).toFixed(2));
  const cbga = parseFloat(randomInRange(0, 1).toFixed(2));
  
  const totalCBD = parseFloat(calculateTotalCBD(cbda, cbd).toFixed(2));
  
  // Create cannabinoid array
  const cannabinoids = [
    createCannabinoid(CANNABINOID_NAMES.THCA, thca, CANNABINOID_LIMITS.THCa.loq, CANNABINOID_LIMITS.THCa.lod),
    createCannabinoid(CANNABINOID_NAMES.D9THC, d9thc, CANNABINOID_LIMITS['Δ9-THC'].loq, CANNABINOID_LIMITS['Δ9-THC'].lod),
    createCannabinoid(CANNABINOID_NAMES.D8THC, 0, CANNABINOID_LIMITS['Δ8-THC'].loq, CANNABINOID_LIMITS['Δ8-THC'].lod),
    createCannabinoid(CANNABINOID_NAMES.THCV, 0, CANNABINOID_LIMITS.THCV.loq, CANNABINOID_LIMITS.THCV.lod),
    createCannabinoid(CANNABINOID_NAMES.CBDA, cbda, CANNABINOID_LIMITS.CBDa.loq, CANNABINOID_LIMITS.CBDa.lod),
    createCannabinoid(CANNABINOID_NAMES.CBD, cbd, CANNABINOID_LIMITS.CBD.loq, CANNABINOID_LIMITS.CBD.lod),
    createCannabinoid(CANNABINOID_NAMES.CBN, 0, CANNABINOID_LIMITS.CBN.loq, CANNABINOID_LIMITS.CBN.lod),
    createCannabinoid(CANNABINOID_NAMES.CBGA, cbga, CANNABINOID_LIMITS.CBGa.loq, CANNABINOID_LIMITS.CBGa.lod),
    createCannabinoid(CANNABINOID_NAMES.CBG, cbg, CANNABINOID_LIMITS.CBG.loq, CANNABINOID_LIMITS.CBG.lod),
    createCannabinoid(CANNABINOID_NAMES.CBC, 0, CANNABINOID_LIMITS.CBC.loq, CANNABINOID_LIMITS.CBC.lod),
  ];

  const totalCannabinoids = parseFloat((thca + d9thc + cbd + cbda + cbg + cbga).toFixed(2));

  return {
    cannabinoids,
    totalTHC: parseFloat(targetTotalTHC.toFixed(2)),
    totalCBD,
    totalCannabinoids
  };
};

/**
 * Generates random moisture content
 */
export const generateMoistureContent = (): number => {
  return parseFloat(randomInRange(MOISTURE_RANGE.min, MOISTURE_RANGE.max).toFixed(2));
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
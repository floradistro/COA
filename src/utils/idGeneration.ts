import { ID_PATTERNS } from '@/constants/defaults';

/**
 * Generates a unique sample ID with format: QA + YYYYMMDD + 4 random digits
 * Enhanced with microsecond precision and sample index for uniqueness
 * @param sampleIndex Optional sample index for batch generation
 * @returns Sample ID string
 */
export const generateSampleId = (sampleIndex?: number): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Use microseconds + sample index for better entropy
  const microseconds = (date.getTime() % 100000);
  const indexPart = sampleIndex !== undefined ? (sampleIndex % 100) : 0;
  const randomBase = (microseconds + indexPart + Math.floor(Math.random() * 1000)) % 10000;
  const random = randomBase.toString().padStart(ID_PATTERNS.sample.randomDigits, '0');
  
  return `${ID_PATTERNS.sample.prefix}${year}${month}${day}${random}`;
};

/**
 * Generates a unique batch ID with various formats
 * Enhanced with timestamp and sample index for uniqueness
 * @param sampleIndex Optional sample index for batch generation
 * @returns Batch ID string
 */
export const generateBatchId = (sampleIndex?: number): string => {
  const formats = [
    // Original format: 2 letters + 4 digits (e.g., AB1234)
    () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let result = '';
      
      // Add timestamp entropy to letter selection
      const timestamp = Date.now();
      const indexOffset = sampleIndex || 0;
      
      for (let i = 0; i < 2; i++) {
        const letterIndex = (timestamp + indexOffset + i + Math.floor(Math.random() * 100)) % letters.length;
        result += letters.charAt(letterIndex);
      }
      
      for (let i = 0; i < 4; i++) {
        const numberIndex = (timestamp + indexOffset + i + Math.floor(Math.random() * 100)) % numbers.length;
        result += numbers.charAt(numberIndex);
      }
      
      return result;
    },
    
    // Format: GC + 4 digits (e.g., GC7201)
    () => {
      const numbers = '0123456789';
      let result = 'GC';
      const timestamp = Date.now();
      const indexOffset = sampleIndex || 0;
      
      for (let i = 0; i < 4; i++) {
        const numberIndex = (timestamp + indexOffset + i + Math.floor(Math.random() * 100)) % numbers.length;
        result += numbers.charAt(numberIndex);
      }
      
      return result;
    },
    
    // Format: MJ- + 4 digits + letter (e.g., MJ-8824A)
    () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let result = 'MJ-';
      const timestamp = Date.now();
      const indexOffset = sampleIndex || 0;
      
      for (let i = 0; i < 4; i++) {
        const numberIndex = (timestamp + indexOffset + i + Math.floor(Math.random() * 100)) % numbers.length;
        result += numbers.charAt(numberIndex);
      }
      
      const letterIndex = (timestamp + indexOffset + Math.floor(Math.random() * 100)) % letters.length;
      result += letters.charAt(letterIndex);
      
      return result;
    },
    
    // Format: Letter + 3 digits + letter (e.g., B342K)
    () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let result = '';
      const timestamp = Date.now();
      const indexOffset = sampleIndex || 0;
      
      const letterIndex1 = (timestamp + indexOffset + Math.floor(Math.random() * 100)) % letters.length;
      result += letters.charAt(letterIndex1);
      
      for (let i = 0; i < 3; i++) {
        const numberIndex = (timestamp + indexOffset + i + Math.floor(Math.random() * 100)) % numbers.length;
        result += numbers.charAt(numberIndex);
      }
      
      const letterIndex2 = (timestamp + indexOffset + 10 + Math.floor(Math.random() * 100)) % letters.length;
      result += letters.charAt(letterIndex2);
      
      return result;
    },
    
    // Format: 3 letters + 3 digits (e.g., THC420)
    () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let result = '';
      const timestamp = Date.now();
      const indexOffset = sampleIndex || 0;
      
      for (let i = 0; i < 3; i++) {
        const letterIndex = (timestamp + indexOffset + i + Math.floor(Math.random() * 100)) % letters.length;
        result += letters.charAt(letterIndex);
      }
      
      for (let i = 0; i < 3; i++) {
        const numberIndex = (timestamp + indexOffset + i + Math.floor(Math.random() * 100)) % numbers.length;
        result += numbers.charAt(numberIndex);
      }
      
      return result;
    }
  ];
  
  // Select format based on timestamp and sample index for consistency within batch
  const formatIndex = (Date.now() + (sampleIndex || 0)) % formats.length;
  const format = formats[formatIndex];
  return format();
};

/**
 * Validates a sample ID format
 * @param id Sample ID to validate
 * @returns Boolean indicating if the ID is valid
 */
export const isValidSampleId = (id: string): boolean => {
  const pattern = new RegExp(
    `^${ID_PATTERNS.sample.prefix}\\d{8}\\d{${ID_PATTERNS.sample.randomDigits}}$`
  );
  return pattern.test(id);
};

/**
 * Validates a batch ID format
 * @param id Batch ID to validate
 * @returns Boolean indicating if the ID is valid
 */
export const isValidBatchId = (id: string): boolean => {
  const pattern = new RegExp(
    `^[A-Z]{${ID_PATTERNS.batch.letterCount}}\\d{${ID_PATTERNS.batch.digitCount}}$`
  );
  return pattern.test(id);
}; 
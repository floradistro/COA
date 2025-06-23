import { ID_PATTERNS } from '@/constants/defaults';

/**
 * Generates a unique sample ID with format: QA + YYYYMMDD + 4 random digits
 * @returns Sample ID string
 */
export const generateSampleId = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(ID_PATTERNS.sample.randomDigits, '0');
  
  return `${ID_PATTERNS.sample.prefix}${year}${month}${day}${random}`;
};

/**
 * Generates a unique batch ID with format: 2 letters + 4 digits
 * @returns Batch ID string
 */
export const generateBatchId = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let result = '';
  
  // Generate letters
  for (let i = 0; i < ID_PATTERNS.batch.letterCount; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Generate numbers
  for (let i = 0; i < ID_PATTERNS.batch.digitCount; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
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
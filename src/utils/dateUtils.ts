import { FormattedDates } from '@/types';
import { DATE_OFFSETS } from '@/constants/defaults';

/**
 * Formats a date to MM/DD/YYYY format
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

/**
 * Generates a set of dates based on the received date with random variations
 * @param receivedDate Date the sample was received (in YYYY-MM-DD format)
 * @returns Object with formatted dates
 */
export const generateDates = (receivedDate: string): FormattedDates => {
  // Parse the received date
  const received = new Date(receivedDate);
  
  // Add random variation of ±1-2 days for more realistic dates
  const receiveVariation = Math.floor(Math.random() * 5) - 2; // -2 to +2 days
  received.setDate(received.getDate() + receiveVariation);
  
  // Calculate other dates based on offsets with variations
  const collected = new Date(received);
  const collectedOffset = DATE_OFFSETS.collectedBeforeReceived + Math.floor(Math.random() * 2); // 1-2 days before
  collected.setDate(collected.getDate() - collectedOffset);
  
  const tested = new Date(received);
  const testedOffset = DATE_OFFSETS.testedAfterReceived + Math.floor(Math.random() * 2); // 2-3 days after
  tested.setDate(tested.getDate() + testedOffset);
  
  const reported = new Date(tested);
  const reportedOffset = DATE_OFFSETS.reportedAfterTested + Math.floor(Math.random() * 2); // 1-2 days after
  reported.setDate(reported.getDate() + reportedOffset);
  
  return {
    collected: formatDate(collected),
    received: formatDate(received),
    tested: formatDate(tested),
    reported: formatDate(reported)
  };
};

/**
 * Parses a date string in MM/DD/YYYY format to a Date object
 * @param dateString Date string to parse
 * @returns Date object or null if invalid
 */
export const parseFormattedDate = (dateString: string): Date | null => {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  
  // Validate the date
  if (date.getMonth() !== month || 
      date.getDate() !== day || 
      date.getFullYear() !== year) {
    return null;
  }
  
  return date;
};

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Generates a random date between two dates (inclusive)
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @param sampleIndex Optional sample index for seeded randomization
 * @returns Random date in MM/DD/YYYY format
 */
export const generateRandomDateInRange = (
  startDate: string, 
  endDate: string, 
  sampleIndex?: number
): string => {
  let start = new Date(startDate);
  let end = new Date(endDate);
  
  // If start and end are the same, return that exact date
  if (start.getTime() === end.getTime() || startDate === endDate) {
    return formatDate(start);
  }
  
  // Ensure start is before end
  if (start > end) {
    [start, end] = [end, start];
  }
  
  // Calculate the time difference in milliseconds
  const timeDiff = end.getTime() - start.getTime();
  
  // Generate random offset with optional seeding
  let randomFactor: number;
  if (sampleIndex !== undefined) {
    // Use sample index for seeded randomization
    const seed = sampleIndex * 1234567 + Date.now() % 10000;
    randomFactor = ((seed * 9301 + 49297) % 233280) / 233280;
  } else {
    randomFactor = Math.random();
  }
  
  const randomOffset = Math.floor(timeDiff * randomFactor);
  const randomDate = new Date(start.getTime() + randomOffset);
  
  return formatDate(randomDate);
};

/**
 * Generates randomized dates within specified ranges
 * @param dateRanges Object containing date ranges
 * @param sampleIndex Optional sample index for seeded randomization
 * @returns Object with randomized dates in MM/DD/YYYY format
 */
export const generateDatesFromRanges = (
  dateRanges: {
    dateCollected: string;
    dateReceived: string;
    dateTested: string;
    dateTestedEnd: string;
  },
  sampleIndex?: number
): FormattedDates => {
  // Use single dates for collected and received (no ranges)
  const collectedDate = new Date(dateRanges.dateCollected);
  const collected = formatDate(collectedDate);
  
  const receivedDate = new Date(dateRanges.dateReceived);
  const received = formatDate(receivedDate);
  
  // Generate random date within tested range
  const tested = generateRandomDateInRange(
    dateRanges.dateTested, 
    dateRanges.dateTestedEnd, 
    sampleIndex ? sampleIndex * 3 + 3 : undefined
  );
  
  // For reported date, use tested date + 1-2 days
  const testedDate = parseFormattedDate(tested);
  const reportedOffset = Math.floor(Math.random() * 2) + 1; // 1-2 days
  const reportedDate = new Date(testedDate!);
  reportedDate.setDate(reportedDate.getDate() + reportedOffset);
  
  return {
    collected,
    received,
    tested,
    reported: formatDate(reportedDate)
  };
};

/**
 * Validates if a date string is in YYYY-MM-DD format
 * @param dateString Date string to validate
 * @returns Boolean indicating if the date is valid
 */
export const isValidDateString = (dateString: string): boolean => {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}; 
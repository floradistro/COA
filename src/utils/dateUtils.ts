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
 * Generates a set of dates based on the received date
 * @param receivedDate Date the sample was received (in YYYY-MM-DD format)
 * @returns Object with formatted dates
 */
export const generateDates = (receivedDate: string): FormattedDates => {
  // Parse the received date
  const received = new Date(receivedDate);
  
  // Calculate other dates based on offsets
  const collected = new Date(received);
  collected.setDate(collected.getDate() - DATE_OFFSETS.collectedBeforeReceived);
  
  const tested = new Date(received);
  tested.setDate(tested.getDate() + DATE_OFFSETS.testedAfterReceived);
  
  const reported = new Date(tested);
  reported.setDate(reported.getDate() + DATE_OFFSETS.reportedAfterTested);
  
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
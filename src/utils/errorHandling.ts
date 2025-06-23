/**
 * Error handling utilities for the COA generator
 */

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  GENERATION = 'GENERATION',
  EXPORT = 'EXPORT',
  UNKNOWN = 'UNKNOWN'
}

// Custom error class
export class COAError extends Error {
  type: ErrorType;
  originalError?: unknown;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, originalError?: unknown) {
    super(message);
    this.name = 'COAError';
    this.type = type;
    this.originalError = originalError;
  }
}

// Error messages
const ERROR_MESSAGES: Record<string, string> = {
  // Validation errors
  'No strains provided': 'Please enter at least one strain name',
  'Invalid date format': 'Please enter a valid date',
  'Invalid product type': 'Please select a valid product type',
  
  // Generation errors
  'Failed to generate COA': 'Unable to generate COA. Please try again',
  'Batch generation failed': 'Failed to generate batch COAs. Please try again',
  
  // Export errors
  'Export failed': 'Failed to export COA. Please check your browser settings',
  'Print failed': 'Failed to print COA. Please check your printer settings',
  'No COAs to export': 'No COAs available to export',
  
  // Generic errors
  'Unknown error': 'An unexpected error occurred. Please try again'
};

// Development-only logging
const isDevelopment = process.env.NODE_ENV === 'development';

// Logger function that only logs in development
export const logError = (error: unknown, context?: string): void => {
  if (isDevelopment) {
    const errorInfo = {
      context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    };
    
    // In development, use console.error
    console.error('COA Generator Error:', errorInfo);
  }
  
  // In production, you could send to an error tracking service here
  // Example: sendToErrorTracker(error, context);
};

// Get user-friendly error message
export const getUserFriendlyMessage = (error: unknown): string => {
  if (error instanceof COAError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Check if we have a predefined message for this error
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.message.includes(key)) {
        return message;
      }
    }
    
    // For specific error types
    if (error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.message.includes('localStorage')) {
      return 'Unable to save data. Please check your browser settings.';
    }
  }
  
  // Default message
  return ERROR_MESSAGES['Unknown error'];
};

// Error boundary error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleErrorBoundary = (error: Error, _: React.ErrorInfo): void => {
  logError(error, 'React Error Boundary');
  
  // You could also show a toast notification here
  showErrorNotification('Something went wrong. Please refresh the page.');
};

// Async error wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      
      // Re-throw as COAError if it's not already
      if (error instanceof COAError) {
        throw error;
      }
      
      throw new COAError(
        getUserFriendlyMessage(error),
        ErrorType.UNKNOWN,
        error
      );
    }
  }) as T;
};

// Validation helpers
export const validateStrain = (strain: string): void => {
  if (!strain || strain.trim().length === 0) {
    throw new COAError('Strain name is required', ErrorType.VALIDATION);
  }
  
  if (strain.length > 100) {
    throw new COAError('Strain name must be less than 100 characters', ErrorType.VALIDATION);
  }
};

export const validateDate = (date: string): void => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new COAError('Invalid date format', ErrorType.VALIDATION);
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new COAError('Invalid date', ErrorType.VALIDATION);
  }
};

export const validateBatchSize = (size: number): void => {
  if (size <= 0) {
    throw new COAError('Batch size must be greater than 0', ErrorType.VALIDATION);
  }
  
  if (size > 100) {
    throw new COAError('Batch size cannot exceed 100 COAs', ErrorType.VALIDATION);
  }
};

// Notification system (placeholder - implement with your UI library)
let notificationCallback: ((message: string) => void) | null = null;

export const setNotificationCallback = (callback: (message: string) => void) => {
  notificationCallback = callback;
};

export const showErrorNotification = (message: string): void => {
  // Use the registered notification callback if available
  if (notificationCallback) {
    notificationCallback(message);
    return;
  }
  
  // Fallback for development
  if (isDevelopment) {
    alert(`Error: ${message}`);
  }
  
  // In production without a notification system, log to console as last resort
  if (!isDevelopment) {
    console.error(`Error notification: ${message}`);
  }
}; 
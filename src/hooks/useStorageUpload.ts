import { useCallback } from 'react';
import { uploadPdfToSupabase } from '@/lib/uploadPdfToSupabase';
import { ensureSupabaseReady } from '@/utils/supabaseUtils';
import { COAError, ErrorType, logError } from '@/utils/errorHandling';
import { COAData } from '@/types';

/**
 * Hook for Supabase storage operations
 * Handles uploading PDF files to cloud storage
 */
export const useStorageUpload = () => {
  const uploadPDF = useCallback(async (filename: string, pdfBuffer: Buffer, coaData?: COAData, vendorId?: string): Promise<string> => {
    try {
      await ensureSupabaseReady();
      const publicUrl = await uploadPdfToSupabase(filename, pdfBuffer, true, coaData, vendorId);
      return publicUrl;
    } catch (error) {
      logError(error, 'Upload PDF to storage');
      throw new COAError(
        'Failed to upload to cloud storage. Please try again.',
        ErrorType.EXPORT,
        error
      );
    }
  }, []);

  return {
    uploadPDF
  };
};


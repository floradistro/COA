import { useCallback } from 'react';
import { generateQrCode } from '@/lib/generateQrCode';

/**
 * Hook for QR code generation
 * Handles generating QR codes for COA URLs
 */
export const useQRGeneration = () => {
  const generateQRForURL = useCallback(async (url: string): Promise<string> => {
    try {
      const qrCodeDataUrl = await generateQrCode(url);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }, []);

  // Generate viewer URL with storeId in path for proper routing
  const generateViewerUrl = useCallback((filename: string, storeId?: string): string => {
    const cleanFilename = filename.replace('.pdf', '');
    // If storeId provided, use new format: /coa/{storeId}/{filename}
    // Otherwise fall back to old format for backward compatibility
    if (storeId) {
      return `https://www.quantixanalytics.com/coa/${storeId}/${cleanFilename}`;
    }
    return `https://www.quantixanalytics.com/coa/${cleanFilename}`;
  }, []);

  return {
    generateQRForURL,
    generateViewerUrl
  };
};


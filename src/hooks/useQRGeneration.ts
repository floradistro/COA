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

  const generateViewerUrl = useCallback((filename: string): string => {
    const cleanFilename = filename.replace('.pdf', '');
    return `https://www.quantixanalytics.com/coa/${cleanFilename}`;
  }, []);

  return {
    generateQRForURL,
    generateViewerUrl
  };
};


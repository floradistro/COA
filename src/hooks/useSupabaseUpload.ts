import { useState, useCallback } from 'react';
import { COAData } from '@/types';
import { generateQrCode } from '@/lib/generateQrCode';
import { uploadPdfToSupabase } from '@/lib/uploadPdfToSupabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { prepareForPdfExport } from '@/utils/colorConversion';
import { EXPORT_CONFIG } from '@/constants/defaults';
import { 
  COAError, 
  ErrorType, 
  withErrorHandling,
  logError 
} from '@/utils/errorHandling';
import { ensureSupabaseReady } from '@/utils/supabaseUtils';

export interface UseSupabaseUploadReturn {
  uploadSingleCOA: (coaData: COAData, updateCOAData?: (data: COAData) => void, generatedCOAs?: COAData[], updateGeneratedCOAs?: (coas: COAData[]) => void, currentIndex?: number) => Promise<string>;
  uploadAllCOAs: (coaDataArray: COAData[], currentCOAData: COAData, updateCurrentCOA: (data: COAData) => void, updateGeneratedCOAs?: (coas: COAData[]) => void) => Promise<string[]>;
  generateQRCodeForPreview: (coaData: COAData, updateCOAData: (data: COAData) => void, generatedCOAs?: COAData[], updateGeneratedCOAs?: (coas: COAData[]) => void, currentIndex?: number) => Promise<void>;
  syncQRCodesFromUploaded: (coaData: COAData, updateCOAData: (data: COAData) => void, generatedCOAs?: COAData[], updateGeneratedCOAs?: (coas: COAData[]) => void, currentIndex?: number) => Promise<void>;
  refreshAllQRCodes: (generatedCOAs: COAData[], updateGeneratedCOAs: (coas: COAData[]) => void, currentCOAData: COAData, updateCurrentCOA: (data: COAData) => void, currentIndex: number) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export const useSupabaseUpload = (componentRef?: React.RefObject<HTMLDivElement | null>): UseSupabaseUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Helper function to wait for images to load
  const waitForImagesLoaded = async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    if (images.length === 0) return;
    
    const imagePromises = Array.from(images).map(img => {
      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Image failed to load: ${img.src}`));
        }, 5000);
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(); // Don't reject, just continue
        };
      });
    });
    
    try {
      await Promise.all(imagePromises);
    } catch (error) {
      console.warn('Some images failed to load:', error);
    }
  };

  // Helper function to render COA to canvas
  const renderCOAToCanvas = useCallback(async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    const cleanup = prepareForPdfExport(element);
    
    try {
      await waitForImagesLoaded(element);
      await new Promise(resolve => setTimeout(resolve, 300));
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const canvas = await html2canvas(element, {
        ...EXPORT_CONFIG.image,
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      return canvas;
    } finally {
      cleanup();
    }
  }, []);

  // Helper function to generate lab site viewer URL
  const generateViewerUrl = (filename: string): string => {
    const cleanFilename = filename.replace('.pdf', '');
    return `https://www.quantixanalytics.com/coa/${cleanFilename}`;
  };

  // Upload single COA to Supabase with QR code
  const uploadSingleCOA = useCallback(async (coaData: COAData, updateCOAData?: (data: COAData) => void, generatedCOAs?: COAData[], updateGeneratedCOAs?: (coas: COAData[]) => void, currentIndex?: number): Promise<string> => {
    if (!componentRef?.current) {
      throw new COAError('COA component not found', ErrorType.EXPORT);
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await ensureSupabaseReady();
      setUploadProgress(20);
      
      // Generate clean filename using client folder and strain name
      const clientName = coaData.clientName || 'Uncategorized';
      const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '_');
      const strainName = coaData.strain || coaData.sampleName;
      const cleanStrainName = strainName.replace(/[^a-z0-9]/gi, '_');
      const uniqueFilename = `${cleanClientName}/${cleanStrainName}.pdf`;
      
      // If no QR code exists, generate one with the expected URL
      let updatedCOAData = coaData;
      if (!coaData.qrCodeDataUrl && updateCOAData) {
        const expectedUrl = generateViewerUrl(uniqueFilename);
        const qrCodeDataUrl = await generateQrCode(expectedUrl);
        
        updatedCOAData = {
          ...coaData,
          qrCodeDataUrl,
          publicUrl: expectedUrl
        };
        
        // Update the COA data to show QR code
        updateCOAData(updatedCOAData);
        
        // Also update in generatedCOAs array if provided
        if (generatedCOAs && updateGeneratedCOAs && typeof currentIndex === 'number') {
          const updatedCOAs = [...generatedCOAs];
          updatedCOAs[currentIndex] = updatedCOAData;
          updateGeneratedCOAs(updatedCOAs);
        }
        
        // Wait for re-render
        await new Promise(resolve => setTimeout(resolve, 500));
        await new Promise(resolve => requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        }));
      }
      
      setUploadProgress(40);
      
      // Wait for QR code to render
      await new Promise(resolve => setTimeout(resolve, 300));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      
      const canvas = await renderCOAToCanvas(componentRef.current!);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        ...EXPORT_CONFIG.pdf,
        format: [210, 297]
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      const x = (pdfWidth - scaledWidth) / 2;
      const y = 0;
      
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      
      setUploadProgress(60);
      
      // Upload PDF
      const pdfBlob = pdf.output('blob');
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
      const publicUrl = await uploadPdfToSupabase(uniqueFilename, pdfBuffer, true);
      
      setUploadProgress(80);
      
      // Verify URLs match - if not, update QR code
      if (updatedCOAData.publicUrl !== publicUrl && updateCOAData) {
        const correctQrCodeDataUrl = await generateQrCode(publicUrl);
        const finalCOAData = {
          ...updatedCOAData,
          qrCodeDataUrl: correctQrCodeDataUrl,
          publicUrl
        };
        updateCOAData(finalCOAData);
        
        if (generatedCOAs && updateGeneratedCOAs && typeof currentIndex === 'number') {
          const updatedCOAs = [...generatedCOAs];
          updatedCOAs[currentIndex] = finalCOAData;
          updateGeneratedCOAs(updatedCOAs);
        }
      }
      
      setUploadProgress(100);
      return publicUrl;
      
    } catch (error) {
      logError(error, 'Upload single COA to Supabase');
      throw new COAError(
        'Failed to upload COA to cloud storage. Please try again.',
        ErrorType.EXPORT,
        error
      );
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  }, [componentRef, renderCOAToCanvas]);

  // Upload all COAs to Supabase
  const uploadAllCOAs = useCallback(async (
    coaDataArray: COAData[], 
    currentCOAData: COAData,
    updateCurrentCOA: (data: COAData) => void,
    updateGeneratedCOAs?: (coas: COAData[]) => void
  ): Promise<string[]> => {
    if (coaDataArray.length === 0) {
      throw new COAError('No COAs to upload', ErrorType.VALIDATION);
    }
    
    if (!componentRef?.current) {
      throw new COAError('COA component not found', ErrorType.EXPORT);
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const originalCOAData = currentCOAData;
    const uploadedUrls: string[] = [];
    
    try {
      // Ensure Supabase is ready
      await ensureSupabaseReady();
      
      const progressPerCOA = 80 / coaDataArray.length;
      
      for (let i = 0; i < coaDataArray.length; i++) {
        const coaData = coaDataArray[i];
        
        setUploadProgress(Math.floor(i * progressPerCOA));
        
        try {
          console.log(`Uploading COA ${i + 1}/${coaDataArray.length}: ${coaData.sampleName}`);
          
          // Update the visible COA template
          updateCurrentCOA(coaData);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await new Promise(resolve => requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          }));
          
          const element = componentRef?.current;
          if (!element) {
            throw new Error('Component ref lost during upload');
          }
          
          // Verify correct data is displayed
          const textContent = element.textContent || '';
          const hasCorrectData = textContent.includes(coaData.sampleId) && 
                                textContent.includes(coaData.strain);
          
          if (!hasCorrectData) {
            console.warn(`COA content verification failed for ${coaData.sampleName}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          
          // Generate clean filename using client folder and strain name
          const clientName = coaData.clientName || 'Uncategorized';
          const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '_');
          const strainName = coaData.strain || coaData.sampleName;
          const cleanStrainName = strainName.replace(/[^a-z0-9]/gi, '_');
          const uniqueFilename = `${cleanClientName}/${cleanStrainName}.pdf`;
          
          // Generate the expected lab site viewer URL
          const expectedUrl = generateViewerUrl(uniqueFilename);
          const qrCodeDataUrl = await generateQrCode(expectedUrl);
          
          // Update the COA data with QR code
          const updatedCOAData = {
            ...coaData,
            qrCodeDataUrl,
            publicUrl: expectedUrl
          };
          
          // Update the display with QR code
          updateCurrentCOA(updatedCOAData);
          await new Promise(resolve => setTimeout(resolve, 500));
          await new Promise(resolve => requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          }));
          
          // Render and upload this COA with QR code
          const canvas = await renderCOAToCanvas(element);
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new jsPDF({
            ...EXPORT_CONFIG.pdf,
            format: [210, 297]
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const scaledWidth = imgWidth * ratio;
          const scaledHeight = imgHeight * ratio;
          const x = (pdfWidth - scaledWidth) / 2;
          const y = 0;
          
          pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
          
          // Upload PDF
          const pdfBlob = pdf.output('blob');
          const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
          const publicUrl = await uploadPdfToSupabase(uniqueFilename, pdfBuffer, true);
          
          // Update the COA in the array if this is the current one
          if (coaDataArray[i].sampleId === currentCOAData.sampleId) {
            // Verify URL matches
            if (publicUrl !== expectedUrl) {
              const correctQrCodeDataUrl = await generateQrCode(publicUrl);
              const finalCOAData = {
                ...updatedCOAData,
                qrCodeDataUrl: correctQrCodeDataUrl,
                publicUrl
              };
              updateCurrentCOA(finalCOAData);
              
              // Update the array as well
              if (updateGeneratedCOAs) {
                const updatedCOAs = [...coaDataArray];
                updatedCOAs[i] = finalCOAData;
                updateGeneratedCOAs(updatedCOAs);
              }
            } else {
              // Update the array with the uploaded COA data
              if (updateGeneratedCOAs) {
                const updatedCOAs = [...coaDataArray];
                updatedCOAs[i] = { ...updatedCOAData, publicUrl };
                updateGeneratedCOAs(updatedCOAs);
              }
            }
          } else {
            // For non-current COAs, update the array
            if (updateGeneratedCOAs) {
              const updatedCOAs = [...coaDataArray];
              updatedCOAs[i] = { ...updatedCOAData, publicUrl };
              updateGeneratedCOAs(updatedCOAs);
            }
          }
          
          uploadedUrls.push(publicUrl);
          
        } catch (error) {
          console.error(`Failed to upload COA for ${coaData.sampleName}:`, error);
          logError(error, `Failed to upload COA for ${coaData.sampleName}`);
          // Continue with other COAs even if one fails
        }
        
        if (i < coaDataArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setUploadProgress(90);
      
      // Restore original COA, but preserve QR code if it was added during upload
      let finalCOAData = originalCOAData;
      if (updateGeneratedCOAs && coaDataArray) {
        const currentCOAInArray = coaDataArray.find(coa => coa.sampleId === originalCOAData.sampleId);
        if (currentCOAInArray && currentCOAInArray.qrCodeDataUrl) {
          finalCOAData = {
            ...originalCOAData,
            qrCodeDataUrl: currentCOAInArray.qrCodeDataUrl,
            publicUrl: currentCOAInArray.publicUrl
          };
        }
      }
      updateCurrentCOA(finalCOAData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress(100);
      return uploadedUrls;
      
    } catch (error) {
      // Restore original COA, but preserve QR code if it was added during upload
      let finalCOAData = originalCOAData;
      if (updateGeneratedCOAs && coaDataArray) {
        // Find the current COA in the updated array to get its QR code data
        const currentCOAInArray = coaDataArray.find(coa => coa.sampleId === originalCOAData.sampleId);
        if (currentCOAInArray && currentCOAInArray.qrCodeDataUrl) {
          finalCOAData = {
            ...originalCOAData,
            qrCodeDataUrl: currentCOAInArray.qrCodeDataUrl,
            publicUrl: currentCOAInArray.publicUrl
          };
        }
      }
      updateCurrentCOA(finalCOAData);
      logError(error, 'Upload all COAs to Supabase');
      throw new COAError(
        'Failed to upload COAs to cloud storage. Please try again.',
        ErrorType.EXPORT,
        error
      );
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  }, [componentRef, renderCOAToCanvas]);

  // Generate QR code for preview using a placeholder URL
  const generateQRCodeForPreview = useCallback(async (coaData: COAData, updateCOAData: (data: COAData) => void, generatedCOAs?: COAData[], updateGeneratedCOAs?: (coas: COAData[]) => void, currentIndex?: number): Promise<void> => {
    try {
      // Generate clean filename using client folder and strain name
      const clientName = coaData.clientName || 'Uncategorized';
      const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '_');
      const strainName = coaData.strain || coaData.sampleName;
      const cleanStrainName = strainName.replace(/[^a-z0-9]/gi, '_');
      const uniqueFilename = `${cleanClientName}/${cleanStrainName}.pdf`;
      const previewUrl = generateViewerUrl(uniqueFilename);
      
      // Generate QR code for the preview URL
      const qrCodeDataUrl = await generateQrCode(previewUrl);
      
      // Update the COA data with QR code information
      const updatedCOAData = {
        ...coaData,
        qrCodeDataUrl: qrCodeDataUrl,
        publicUrl: previewUrl
      };
      
      updateCOAData(updatedCOAData);
      
      // Also update in generatedCOAs array if provided
      if (generatedCOAs && updateGeneratedCOAs && typeof currentIndex === 'number') {
        const updatedCOAs = [...generatedCOAs];
        updatedCOAs[currentIndex] = updatedCOAData;
        updateGeneratedCOAs(updatedCOAs);
      }
    } catch (error) {
      console.error('Error in generateQRCodeForPreview:', error);
      logError(error, 'Generate QR code for preview');
      throw new COAError(
        'Failed to generate QR code for preview. Please try again.',
        ErrorType.EXPORT,
        error
      );
    }
  }, []);

  // Sync QR codes from uploaded COAs back to the preview
  const syncQRCodesFromUploaded = useCallback(async (coaData: COAData, updateCOAData: (data: COAData) => void, generatedCOAs?: COAData[], updateGeneratedCOAs?: (coas: COAData[]) => void, currentIndex?: number): Promise<void> => {
    try {
      // If the current COA already has a publicUrl, generate a fresh QR code for it
      if (coaData.publicUrl) {
        const qrCodeDataUrl = await generateQrCode(coaData.publicUrl);
        
        const updatedCOAData = {
          ...coaData,
          qrCodeDataUrl
        };
        
        updateCOAData(updatedCOAData);
        
        // Also update in generatedCOAs array if provided
        if (generatedCOAs && updateGeneratedCOAs && typeof currentIndex === 'number') {
          const updatedCOAs = [...generatedCOAs];
          updatedCOAs[currentIndex] = updatedCOAData;
          updateGeneratedCOAs(updatedCOAs);
        }
        
        return;
      }
      
      // Find the uploaded COA in the generatedCOAs array by current index
      if (generatedCOAs && updateGeneratedCOAs && typeof currentIndex === 'number') {
        if (currentIndex >= 0 && currentIndex < generatedCOAs.length) {
          const uploadedCOA = generatedCOAs[currentIndex];
          
          if (uploadedCOA && uploadedCOA.publicUrl) {
            // Generate fresh QR code for the public URL
            const qrCodeDataUrl = await generateQrCode(uploadedCOA.publicUrl);
            
            // Update the preview COA with the fresh QR code
            const updatedCOAData = {
              ...coaData,
              qrCodeDataUrl,
              publicUrl: uploadedCOA.publicUrl
            };
            
            updateCOAData(updatedCOAData);
            
            // Also update in generatedCOAs array
            const updatedCOAs = [...generatedCOAs];
            updatedCOAs[currentIndex] = updatedCOAData;
            updateGeneratedCOAs(updatedCOAs);
            
            return;
          }
        }
        
        // Fallback: Try to find uploaded COA by matching sample ID
        const uploadedCOA = generatedCOAs.find(coa => 
          coa.sampleId === coaData.sampleId && coa.publicUrl
        );
        
        if (uploadedCOA && uploadedCOA.publicUrl) {
          // Generate fresh QR code for the public URL
          const qrCodeDataUrl = await generateQrCode(uploadedCOA.publicUrl);
          
          // Update the preview COA with the fresh QR code
          const updatedCOAData = {
            ...coaData,
            qrCodeDataUrl,
            publicUrl: uploadedCOA.publicUrl
          };
          
          updateCOAData(updatedCOAData);
          
          // Also update in generatedCOAs array
          const updatedCOAs = [...generatedCOAs];
          const targetIndex = generatedCOAs.findIndex(coa => coa.sampleId === coaData.sampleId);
          if (targetIndex >= 0) {
            updatedCOAs[targetIndex] = updatedCOAData;
            updateGeneratedCOAs(updatedCOAs);
          }
          
          return;
        }
      }
      
      throw new COAError(
        'No uploaded COA found to sync QR code from. Please upload the COA first.',
        ErrorType.VALIDATION
      );
      
    } catch (error) {
      console.error('Error in syncQRCodesFromUploaded:', error);
      logError(error, 'Sync QR codes from uploaded');
      throw error instanceof COAError ? error : new COAError(
        'Failed to sync QR code from uploaded COA. Please try again.',
        ErrorType.EXPORT,
        error
      );
    }
  }, []);

  // Refresh QR codes for all uploaded COAs
  const refreshAllQRCodes = useCallback(async (generatedCOAs: COAData[], updateGeneratedCOAs: (coas: COAData[]) => void, currentCOAData: COAData, updateCurrentCOA: (data: COAData) => void, currentIndex: number): Promise<void> => {
    try {
      const updatedCOAs = await Promise.all(
        generatedCOAs.map(async (coa) => {
          if (coa.publicUrl) {
            const qrCodeDataUrl = await generateQrCode(coa.publicUrl);
            return {
              ...coa,
              qrCodeDataUrl
            };
          }
          return coa;
        })
      );
      
      // Update the generated COAs array
      updateGeneratedCOAs(updatedCOAs);
      
      // Update the current COA if it was refreshed
      if (updatedCOAs[currentIndex] && updatedCOAs[currentIndex].publicUrl) {
        updateCurrentCOA(updatedCOAs[currentIndex]);
      }
    } catch (error) {
      console.error('Error in refreshAllQRCodes:', error);
      logError(error, 'Refresh all QR codes');
      throw new COAError(
        'Failed to refresh QR codes for all COAs. Please try again.',
        ErrorType.EXPORT,
        error
      );
    }
  }, []);

  // Wrap functions with error handling
  const safeUploadSingleCOA = withErrorHandling(
    uploadSingleCOA,
    'Upload single COA to Supabase'
  );
  
  const safeUploadAllCOAs = withErrorHandling(
    uploadAllCOAs,
    'Upload all COAs to Supabase'
  );

  // Wrap the preview function with error handling
  const safeGenerateQRCodeForPreview = withErrorHandling(
    generateQRCodeForPreview,
    'Generate QR code for preview'
  );

  // Wrap the sync function with error handling
  const safeSyncQRCodesFromUploaded = withErrorHandling(
    syncQRCodesFromUploaded,
    'Sync QR codes from uploaded COA'
  );

  return {
    uploadSingleCOA: safeUploadSingleCOA,
    uploadAllCOAs: safeUploadAllCOAs,
    generateQRCodeForPreview: safeGenerateQRCodeForPreview,
    syncQRCodesFromUploaded: safeSyncQRCodesFromUploaded,
    refreshAllQRCodes,
    isUploading,
    uploadProgress
  };
}; 
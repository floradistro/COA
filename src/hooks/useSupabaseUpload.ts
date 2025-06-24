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
  uploadSingleCOA: (coaData: COAData, updateCOAData?: (data: COAData) => void) => Promise<string>;
  uploadAllCOAs: (coaDataArray: COAData[], currentCOAData: COAData, updateCurrentCOA: (data: COAData) => void) => Promise<string[]>;
  isUploading: boolean;
  uploadProgress: number;
}

export const useSupabaseUpload = (componentRef: React.RefObject<HTMLDivElement>): UseSupabaseUploadReturn => {
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
        backgroundColor: '#ffffff'
      });
      
      return canvas;
    } finally {
      cleanup();
    }
  }, []);

  // Upload single COA to Supabase with QR code
  const uploadSingleCOA = useCallback(async (coaData: COAData, updateCOAData?: (data: COAData) => void): Promise<string> => {
    if (!componentRef.current) {
      throw new COAError('COA component not found', ErrorType.EXPORT);
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Ensure Supabase is ready
      await ensureSupabaseReady();
      
      setUploadProgress(20);
      
      const canvas = await renderCOAToCanvas(componentRef.current);
      
      setUploadProgress(40);
      
      // Convert to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        ...EXPORT_CONFIG.pdf,
        format: [210, 297]
      });
      
      // Calculate dimensions to fit A4
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
      
      // Generate filename
      const fileName = `COA_${coaData.sampleName.replace(/[^a-z0-9]/gi, '_')}_${coaData.sampleId}.pdf`;
      
      // Upload to Supabase first to get the public URL
      const pdfBlob = pdf.output('blob');
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
      const publicUrl = await uploadPdfToSupabase(fileName, pdfBuffer);
      
      setUploadProgress(80);
      
      // Generate QR code for the public URL
      const qrCodeDataUrl = await generateQrCode(publicUrl);
      
      // Update the COA data with QR code information if callback provided
      if (updateCOAData) {
        const updatedCOAData = {
          ...coaData,
          qrCodeDataUrl,
          publicUrl
        };
        updateCOAData(updatedCOAData);
        
        // Wait a moment for the UI to update with the QR code, then re-render
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Re-render the canvas with the QR code now in the template
        const updatedCanvas = await renderCOAToCanvas(componentRef.current!);
        const updatedImgData = updatedCanvas.toDataURL('image/png', 1.0);
        
        // Create a new PDF with the updated image that includes the QR code
        const updatedPdf = new jsPDF({
          ...EXPORT_CONFIG.pdf,
          format: [210, 297]
        });
        
        const updatedPdfWidth = updatedPdf.internal.pageSize.getWidth();
        const updatedPdfHeight = updatedPdf.internal.pageSize.getHeight();
        const updatedImgWidth = updatedCanvas.width;
        const updatedImgHeight = updatedCanvas.height;
        const updatedRatio = Math.min(updatedPdfWidth / updatedImgWidth, updatedPdfHeight / updatedImgHeight);
        const updatedScaledWidth = updatedImgWidth * updatedRatio;
        const updatedScaledHeight = updatedImgHeight * updatedRatio;
        const updatedX = (updatedPdfWidth - updatedScaledWidth) / 2;
        const updatedY = 0;
        
        updatedPdf.addImage(updatedImgData, 'PNG', updatedX, updatedY, updatedScaledWidth, updatedScaledHeight);
        
        // Upload the final PDF with QR code
        const finalPdfBlob = updatedPdf.output('blob');
        const finalPdfBuffer = Buffer.from(await finalPdfBlob.arrayBuffer());
        const finalUrl = await uploadPdfToSupabase(fileName, finalPdfBuffer);
        
        return finalUrl;
      } else {
        // No callback provided, upload the PDF without QR code
        return publicUrl;
      }
      
      setUploadProgress(100);
      
      console.log(`COA uploaded to Supabase: ${publicUrl}`);
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
    updateCurrentCOA: (data: COAData) => void
  ): Promise<string[]> => {
    if (coaDataArray.length === 0) {
      throw new COAError('No COAs to upload', ErrorType.VALIDATION);
    }
    
    if (!componentRef.current) {
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
          
          const element = componentRef.current;
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
          
          // Render and upload this COA
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
          
          const fileName = `COA_${coaData.sampleName.replace(/[^a-z0-9]/gi, '_')}_${coaData.sampleId}.pdf`;
          
          // Upload to get public URL
          const pdfBlob = pdf.output('blob');
          const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
          const publicUrl = await uploadPdfToSupabase(fileName, pdfBuffer);
          
          // Generate QR code and add to PDF
          const qrCodeDataUrl = await generateQrCode(publicUrl);
          
          // Update the COA data with QR code information
          const updatedCOAData = {
            ...coaData,
            qrCodeDataUrl,
            publicUrl
          };
          
          // Update the COA in the array (this will affect the displayed COA if it's the current one)
          if (coaDataArray[i].sampleId === currentCOAData.sampleId) {
            updateCurrentCOA(updatedCOAData);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Re-render with QR code
            const updatedCanvas = await renderCOAToCanvas(element);
            const updatedImgData = updatedCanvas.toDataURL('image/png', 1.0);
            
            const updatedPdf = new jsPDF({
              ...EXPORT_CONFIG.pdf,
              format: [210, 297]
            });
            
            const updatedPdfWidth = updatedPdf.internal.pageSize.getWidth();
            const updatedPdfHeight = updatedPdf.internal.pageSize.getHeight();
            const updatedImgWidth = updatedCanvas.width;
            const updatedImgHeight = updatedCanvas.height;
            const updatedRatio = Math.min(updatedPdfWidth / updatedImgWidth, updatedPdfHeight / updatedImgHeight);
            const updatedScaledWidth = updatedImgWidth * updatedRatio;
            const updatedScaledHeight = updatedImgHeight * updatedRatio;
            const updatedX = (updatedPdfWidth - updatedScaledWidth) / 2;
            const updatedY = 0;
            
            updatedPdf.addImage(updatedImgData, 'PNG', updatedX, updatedY, updatedScaledWidth, updatedScaledHeight);
            
            const finalPdfBlob = updatedPdf.output('blob');
            const finalPdfBuffer = Buffer.from(await finalPdfBlob.arrayBuffer());
            const finalUrl = await uploadPdfToSupabase(fileName, finalPdfBuffer);
            uploadedUrls.push(finalUrl);
          } else {
            // For non-current COAs, just upload without re-rendering
            const finalPdfBlob = pdf.output('blob');
            const finalPdfBuffer = Buffer.from(await finalPdfBlob.arrayBuffer());
            const finalUrl = await uploadPdfToSupabase(fileName, finalPdfBuffer);
            uploadedUrls.push(finalUrl);
          }
          
          console.log(`Successfully uploaded COA for ${coaData.sampleName}`);
          
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
      
      // Restore original COA
      updateCurrentCOA(originalCOAData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress(100);
      console.log(`Bulk upload completed. ${uploadedUrls.length}/${coaDataArray.length} COAs uploaded successfully.`);
      
      return uploadedUrls;
      
    } catch (error) {
      updateCurrentCOA(originalCOAData);
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

  // Wrap functions with error handling
  const safeUploadSingleCOA = withErrorHandling(
    uploadSingleCOA,
    'Upload single COA to Supabase'
  );
  
  const safeUploadAllCOAs = withErrorHandling(
    uploadAllCOAs,
    'Upload all COAs to Supabase'
  );

  return {
    uploadSingleCOA: safeUploadSingleCOA,
    uploadAllCOAs: safeUploadAllCOAs,
    isUploading,
    uploadProgress
  };
}; 
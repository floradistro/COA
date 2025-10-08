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
    console.log('=== RENDER COA TO CANVAS ===');
    console.log('Element:', element);
    console.log('Element tagName:', element.tagName);
    console.log('Element className:', element.className);
    console.log('Element offsetWidth:', element.offsetWidth);
    console.log('Element offsetHeight:', element.offsetHeight);
    console.log('Element innerHTML length:', element.innerHTML?.length);
    
    const cleanup = prepareForPdfExport(element);
    
    try {
      await waitForImagesLoaded(element);
      await new Promise(resolve => setTimeout(resolve, 300));
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const canvas = await html2canvas(element, {
        ...EXPORT_CONFIG.image,
        logging: true,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 2,
        onclone: (clonedDoc, element) => {
          console.log('html2canvas onclone - element:', element);
          console.log('html2canvas onclone - element dimensions:', {
            width: element.offsetWidth,
            height: element.offsetHeight
          });
        }
      });
      
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('=== END RENDER COA TO CANVAS ===');
      
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
    console.log('=== UPLOAD SINGLE COA DEBUG ===');
    console.log('componentRef:', componentRef);
    console.log('componentRef.current:', componentRef?.current);
    
    if (!componentRef?.current) {
      console.error('Component ref is null');
      throw new COAError('COA component not found', ErrorType.EXPORT);
    }
    
    console.log('Component found:', {
      tagName: componentRef.current.tagName,
      className: componentRef.current.className,
      innerHTML: componentRef.current.innerHTML?.substring(0, 100) + '...'
    });
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Ensure Supabase is ready
      await ensureSupabaseReady();
      
      setUploadProgress(20);
      
      // Generate clean filename using client folder and strain name
      const clientName = coaData.clientName || 'Uncategorized';
      const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '_');
      const strainName = coaData.strain || coaData.sampleName;
      const cleanStrainName = strainName.replace(/[^a-z0-9]/gi, '_');
      const uniqueFilename = `${cleanClientName}/${cleanStrainName}.pdf`;
      
      console.log('=== UPLOAD FILENAME ===');
      console.log('Client name:', clientName);
      console.log('Strain name:', strainName);
      console.log('Clean filename with folder:', uniqueFilename);
      
      // If no QR code exists, generate one with the expected URL
      let updatedCOAData = coaData;
      if (!coaData.qrCodeDataUrl && updateCOAData) {
        // Generate the expected lab site viewer URL
        const expectedUrl = generateViewerUrl(uniqueFilename);
        
        console.log('Generating QR code for expected URL:', expectedUrl);
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
      
      // Now render with QR code included
      // Temporarily make the export wrapper visible
      const exportWrapper = componentRef.current?.closest('.coa-export-wrapper') as HTMLElement;
      if (exportWrapper) {
        console.log('Making export wrapper visible for rendering');
        exportWrapper.style.height = 'auto';
        exportWrapper.style.overflow = 'visible';
      }
      
      // Wait for layout
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      
      const canvas = await renderCOAToCanvas(componentRef.current!);
      
      // Hide the export wrapper again
      if (exportWrapper) {
        console.log('Hiding export wrapper after rendering');
        exportWrapper.style.height = '0';
        exportWrapper.style.overflow = 'hidden';
      }
      
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
      
      // Upload with the filename we used for QR code
      const pdfBlob = pdf.output('blob');
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
      console.log('Uploading with filename:', uniqueFilename);
      const publicUrl = await uploadPdfToSupabase(uniqueFilename, pdfBuffer, true);
      
      setUploadProgress(80);
      
      // Verify URLs match exactly
      console.log('=== URL VERIFICATION ===');
      console.log('Expected URL (from QR):', updatedCOAData.publicUrl);
      console.log('Actual URL (from upload):', publicUrl);
      console.log('URLs match:', updatedCOAData.publicUrl === publicUrl);
      
      if (updatedCOAData.publicUrl !== publicUrl && updateCOAData) {
        console.warn('⚠️ URL mismatch detected!');
        console.log('Updating QR code with actual URL:', publicUrl);
        const correctQrCodeDataUrl = await generateQrCode(publicUrl);
        const finalCOAData = {
          ...updatedCOAData,
          qrCodeDataUrl: correctQrCodeDataUrl,
          publicUrl
        };
        updateCOAData(finalCOAData);
        
        // Also update in generatedCOAs array if provided
        if (generatedCOAs && updateGeneratedCOAs && typeof currentIndex === 'number') {
          const updatedCOAs = [...generatedCOAs];
          updatedCOAs[currentIndex] = finalCOAData;
          updateGeneratedCOAs(updatedCOAs);
        }
      } else {
        console.log('✅ URLs match perfectly! QR code should work correctly');
      }
      
      setUploadProgress(100);
      console.log(`✅ COA uploaded to Supabase with matching QR code: ${publicUrl}`);
      
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
          
          console.log('=== BULK UPLOAD FILENAME ===');
          console.log(`COA ${i + 1}: Client name:`, clientName);
          console.log(`COA ${i + 1}: Strain name:`, strainName);
          console.log(`COA ${i + 1}: Clean filename with folder:`, uniqueFilename);
          
          // Generate the expected lab site viewer URL
          const expectedUrl = generateViewerUrl(uniqueFilename);
          
          // Generate QR code with expected URL
          console.log(`Generating QR code for ${coaData.sampleName}:`, expectedUrl);
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
          // Temporarily make the export wrapper visible
          const exportWrapper = element.closest('.coa-export-wrapper') as HTMLElement;
          if (exportWrapper) {
            exportWrapper.style.height = 'auto';
            exportWrapper.style.overflow = 'visible';
          }
          
          // Wait for layout
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          
          const canvas = await renderCOAToCanvas(element);
          
          // Hide the export wrapper again
          if (exportWrapper) {
            exportWrapper.style.height = '0';
            exportWrapper.style.overflow = 'hidden';
          }
          
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
          
          // Upload with the filename we used for QR code
          const pdfBlob = pdf.output('blob');
          const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
          console.log(`COA ${i + 1}: Uploading with filename:`, uniqueFilename);
          const publicUrl = await uploadPdfToSupabase(uniqueFilename, pdfBuffer, true);
          
          // Verify URLs match exactly
          console.log(`=== COA ${i + 1} URL VERIFICATION ===`);
          console.log('Expected URL (from QR):', expectedUrl);
          console.log('Actual URL (from upload):', publicUrl);
          console.log('URLs match:', expectedUrl === publicUrl);
          
          // Update the COA in the array if this is the current one
          if (coaDataArray[i].sampleId === currentCOAData.sampleId) {
            // Verify URL matches
            if (publicUrl !== expectedUrl) {
              console.warn(`⚠️ COA ${i + 1}: URL mismatch detected!`);
              console.log('Updating QR code with actual URL:', publicUrl);
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
                console.log(`✅ COA ${i + 1}: URLs match perfectly! QR code should work correctly for`, coaData.sampleName);
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress(100);
      console.log(`Bulk upload completed. ${uploadedUrls.length}/${coaDataArray.length} COAs uploaded successfully.`);
      
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
      console.log('Starting QR code generation for preview...');
      
      // Generate clean filename using client folder and strain name
      const clientName = coaData.clientName || 'Uncategorized';
      const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '_');
      const strainName = coaData.strain || coaData.sampleName;
      const cleanStrainName = strainName.replace(/[^a-z0-9]/gi, '_');
      const uniqueFilename = `${cleanClientName}/${cleanStrainName}.pdf`;
      const previewUrl = generateViewerUrl(uniqueFilename);
      console.log('=== PREVIEW QR GENERATION ===');
      console.log('Client name:', clientName);
      console.log('Strain name:', strainName);
      console.log('Preview filename with folder:', uniqueFilename);
      console.log('Generated preview URL:', previewUrl);
      
      // Generate QR code for the preview URL
      const qrCodeDataUrl = await generateQrCode(previewUrl);
      console.log('QR code data URL generated:', qrCodeDataUrl.substring(0, 50) + '...');
      
      // Update the COA data with QR code information
      const updatedCOAData = {
        ...coaData,
        qrCodeDataUrl: qrCodeDataUrl,
        publicUrl: previewUrl
      };
      
      console.log('Updating COA data with QR code...');
      updateCOAData(updatedCOAData);
      
      // Also update in generatedCOAs array if provided
      if (generatedCOAs && updateGeneratedCOAs && typeof currentIndex === 'number') {
        const updatedCOAs = [...generatedCOAs];
        updatedCOAs[currentIndex] = updatedCOAData;
        updateGeneratedCOAs(updatedCOAs);
      }
      
      console.log(`QR code generated for preview: ${previewUrl}`);
      console.log('Note: This is a preview QR code. For working QR codes, upload the COA to generate the actual URL.');
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
      console.log('Starting QR code synchronization from uploaded COA...');
      console.log('Current COA data:', {
        sampleId: coaData.sampleId,
        sampleName: coaData.sampleName,
        hasQRCode: !!coaData.qrCodeDataUrl,
        hasPublicUrl: !!coaData.publicUrl,
        publicUrl: coaData.publicUrl
      });
      console.log('Current index:', currentIndex);
      console.log('Generated COAs count:', generatedCOAs?.length || 0);
      
      // Debug: Log all generated COAs with their upload status
      if (generatedCOAs) {
        console.log('Generated COAs status:');
        generatedCOAs.forEach((coa, index) => {
          console.log(`  COA ${index}: ${coa.sampleName} (${coa.sampleId}) - QR: ${!!coa.qrCodeDataUrl}, URL: ${!!coa.publicUrl}`);
          if (coa.publicUrl) {
            console.log(`    Public URL: ${coa.publicUrl}`);
          }
        });
      }
      
      // Note: We cannot validate quantixanalytics.com URLs directly
      // The backend at quantixanalytics.com handles serving files from private Supabase
      
      // If the current COA already has a publicUrl, generate a fresh QR code for it
      if (coaData.publicUrl) {
        console.log('Found existing public URL on current COA, generating fresh QR code:', coaData.publicUrl);
        
        // Note: We trust that quantixanalytics.com will serve the file
        console.log('COA will be accessible via quantixanalytics.com backend');
        
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
        
        console.log('QR code refreshed for current COA using existing publicUrl');
        return;
      }
      
      // Find the uploaded COA in the generatedCOAs array by current index
      if (generatedCOAs && updateGeneratedCOAs && typeof currentIndex === 'number') {
        if (currentIndex >= 0 && currentIndex < generatedCOAs.length) {
          const uploadedCOA = generatedCOAs[currentIndex];
          console.log('Found COA at current index:', {
            sampleId: uploadedCOA.sampleId,
            sampleName: uploadedCOA.sampleName,
            hasQRCode: !!uploadedCOA.qrCodeDataUrl,
            hasPublicUrl: !!uploadedCOA.publicUrl,
            publicUrl: uploadedCOA.publicUrl
          });
          
          if (uploadedCOA && uploadedCOA.publicUrl) {
            console.log('Found uploaded COA public URL:', uploadedCOA.publicUrl);
            
            // Note: We trust that quantixanalytics.com will serve the file
            console.log('COA will be accessible via quantixanalytics.com backend');
            
            // Generate fresh QR code for the public URL
            const qrCodeDataUrl = await generateQrCode(uploadedCOA.publicUrl);
            
            // Update the preview COA with the fresh QR code
            const updatedCOAData = {
              ...coaData,
              qrCodeDataUrl,
              publicUrl: uploadedCOA.publicUrl
            };
            
            console.log('Updating preview COA data with fresh QR code...');
            updateCOAData(updatedCOAData);
            
            // Also update in generatedCOAs array
            const updatedCOAs = [...generatedCOAs];
            updatedCOAs[currentIndex] = updatedCOAData;
            updateGeneratedCOAs(updatedCOAs);
            
            console.log('QR code synchronized from uploaded COA');
            return;
          } else {
            console.log('COA at current index has no public URL');
          }
        } else {
          console.log('Current index is out of bounds:', currentIndex, 'vs array length:', generatedCOAs.length);
        }
        
        // Fallback: Try to find uploaded COA by matching sample ID
        console.log('Trying fallback: searching by sample ID...');
        const uploadedCOA = generatedCOAs.find(coa => 
          coa.sampleId === coaData.sampleId && coa.publicUrl
        );
        
        if (uploadedCOA && uploadedCOA.publicUrl) {
          console.log('Found uploaded COA by sample ID:', uploadedCOA.sampleId, 'with URL:', uploadedCOA.publicUrl);
          
          // Note: We trust that quantixanalytics.com will serve the file
          console.log('COA will be accessible via quantixanalytics.com backend');
          
          // Generate fresh QR code for the public URL
          const qrCodeDataUrl = await generateQrCode(uploadedCOA.publicUrl);
          
          // Update the preview COA with the fresh QR code
          const updatedCOAData = {
            ...coaData,
            qrCodeDataUrl,
            publicUrl: uploadedCOA.publicUrl
          };
          
          console.log('Updating preview COA data with fresh QR code from sample ID match...');
          updateCOAData(updatedCOAData);
          
          // Also update in generatedCOAs array
          const updatedCOAs = [...generatedCOAs];
          const targetIndex = generatedCOAs.findIndex(coa => coa.sampleId === coaData.sampleId);
          if (targetIndex >= 0) {
            updatedCOAs[targetIndex] = updatedCOAData;
            updateGeneratedCOAs(updatedCOAs);
          }
          
          console.log('QR code synchronized from uploaded COA by sample ID match');
          return;
        }
      }
      
      console.log('No uploaded COA found to sync QR code from');
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
      console.log('Starting QR code refresh for all uploaded COAs...');
      
      const updatedCOAs = await Promise.all(
        generatedCOAs.map(async (coa, index) => {
          if (coa.publicUrl) {
            console.log(`Refreshing QR code for COA ${index}: ${coa.sampleName}`);
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
        console.log('Current COA QR code refreshed');
      }
      
      console.log('All QR codes refreshed successfully');
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
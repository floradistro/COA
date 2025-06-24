import React, { useRef, useCallback, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { COAData } from '@/types';
import { prepareForPdfExport } from '@/utils/colorConversion';
import { EXPORT_CONFIG } from '@/constants/defaults';
import { 
  COAError, 
  ErrorType, 
  withErrorHandling,
  logError 
} from '@/utils/errorHandling';
import { generateQrCode } from '@/lib/generateQrCode';
import { uploadPdfToSupabase } from '@/lib/uploadPdfToSupabase';

export interface UseCOAExportReturn {
  componentRef: React.RefObject<HTMLDivElement>;
  handlePrint: () => void;
  exportSinglePDF: (coaData: COAData, updateCOAData?: (data: COAData) => void) => Promise<void>;
  exportAllCOAs: (coaDataArray: COAData[], currentCOAData: COAData, updateCurrentCOA: (data: COAData) => void) => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
}

export const useCOAExport = (): UseCOAExportReturn => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Print functionality using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Certificate of Analysis',
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onPrintError: (error) => {
      logError(error, 'Print operation');
      throw new COAError('Failed to print COA', ErrorType.EXPORT, error);
    }
  });
  
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
        }, 5000); // 5 second timeout
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          // Don't reject for image errors, just resolve to continue
          resolve();
        };
      });
    });
    
    try {
      await Promise.all(imagePromises);
    } catch (error) {
      console.warn('Some images failed to load:', error);
      // Continue anyway
    }
  };
  
  // Helper function to render COA to canvas with improved timing
  const renderCOAToCanvas = useCallback(async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    // Prepare element for export
    const cleanup = prepareForPdfExport(element);
    
    try {
      // Wait for images to load
      await waitForImagesLoaded(element);
      
      // Additional delay to ensure all styles are applied
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Use requestAnimationFrame for better timing
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Capture the component as canvas
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
      // Clean up color conversions
      cleanup();
    }
  }, []);
  
  // Export single COA as PDF
  const exportSinglePDF = useCallback(async (coaData: COAData, updateCOAData?: (data: COAData) => void): Promise<void> => {
    if (!componentRef.current) {
      throw new COAError('COA component not found', ErrorType.EXPORT);
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      setExportProgress(20);
      
      const canvas = await renderCOAToCanvas(componentRef.current);
      
      setExportProgress(40);
      
      // Convert to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        ...EXPORT_CONFIG.pdf,
        format: [210, 297] // A4 size in mm
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
      
      setExportProgress(60);
      
      // Generate filename
      const fileName = `COA_${coaData.sampleName.replace(/[^a-z0-9]/gi, '_')}_${coaData.sampleId}.pdf`;
      
      // Upload to Supabase first to get the public URL
      const pdfBlob = pdf.output('blob');
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
      const publicUrl = await uploadPdfToSupabase(fileName, pdfBuffer);
      
      setExportProgress(80);
      
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
        
        // Save the updated PDF
        updatedPdf.save(fileName);
        
        // Upload the final version to Supabase
        const finalPdfBlob = updatedPdf.output('blob');
        const finalPdfBuffer = Buffer.from(await finalPdfBlob.arrayBuffer());
        await uploadPdfToSupabase(fileName, finalPdfBuffer);
      } else {
        // No callback provided, save the PDF without QR code
        pdf.save(fileName);
      }
      
      setExportProgress(100);
      
      console.log(`COA uploaded to Supabase: ${publicUrl}`);
    } catch (error) {
      logError(error, 'Export single PDF');
      throw new COAError(
        'Failed to export PDF. Please try again.',
        ErrorType.EXPORT,
        error
      );
    } finally {
      // Reset state after a delay
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    }
  }, [renderCOAToCanvas]);
  
  // Export multiple COAs as ZIP - NEW IMPLEMENTATION
  const exportAllCOAs = useCallback(async (
    coaDataArray: COAData[], 
    currentCOAData: COAData,
    updateCurrentCOA: (data: COAData) => void
  ): Promise<void> => {
    if (coaDataArray.length === 0) {
      throw new COAError('No COAs to export', ErrorType.VALIDATION);
    }
    
    if (!componentRef.current) {
      throw new COAError('COA component not found', ErrorType.EXPORT);
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    const zip = new JSZip();
    const coaFolder = zip.folder('COA_Batch');
    
    if (!coaFolder) {
      throw new COAError('Failed to create ZIP folder', ErrorType.EXPORT);
    }
    
    // Store the original COA data to restore later
    const originalCOAData = currentCOAData;
    
    try {
      const progressPerCOA = 80 / coaDataArray.length;
      
      // Process each COA by updating the visible component
      for (let i = 0; i < coaDataArray.length; i++) {
        const coaData = coaDataArray[i];
        
        // Update progress
        setExportProgress(Math.floor(i * progressPerCOA));
        
        try {
          console.log(`Processing COA ${i + 1}/${coaDataArray.length}: ${coaData.sampleName}`);
          
          // Update the visible COA template with this COA's data
          updateCurrentCOA(coaData);
          
          // Wait for React to re-render with the new data
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Additional wait to ensure DOM is fully updated
          await new Promise(resolve => requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          }));
          
          // Verify the component has the correct data
          const element = componentRef.current;
          if (!element) {
            throw new Error('Component ref lost during export');
          }
          
          const textContent = element.textContent || '';
          const hasCorrectData = textContent.includes(coaData.sampleId) && 
                                textContent.includes(coaData.strain);
          
          if (!hasCorrectData) {
            console.warn(`COA content verification failed for ${coaData.sampleName}, retrying...`);
            // Give it more time
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          
          // Capture the current COA as canvas
          const canvas = await renderCOAToCanvas(element);
          
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
          
          const fileName = `COA_${coaData.sampleName.replace(/[^a-z0-9]/gi, '_')}_${coaData.sampleId}.pdf`;
          
          // Upload to Supabase to get public URL
          const pdfBlob = pdf.output('blob');
          const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
          const publicUrl = await uploadPdfToSupabase(fileName, pdfBuffer);
          
          // Generate QR code for the public URL
          const qrCodeDataUrl = await generateQrCode(publicUrl);
          
          // Re-render with QR code if this is the current COA
          if (coaData.sampleId === currentCOAData.sampleId) {
            // Update current COA to include QR code
            const updatedCOAData = {
              ...coaData,
              qrCodeDataUrl,
              publicUrl
            };
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
            coaFolder.file(fileName, finalPdfBlob);
            
            const finalPdfBuffer = Buffer.from(await finalPdfBlob.arrayBuffer());
            await uploadPdfToSupabase(fileName, finalPdfBuffer);
          } else {
            // For non-current COAs, just save without re-rendering
            const finalPdfBlob = pdf.output('blob');
            coaFolder.file(fileName, finalPdfBlob);
            
            const finalPdfBuffer = Buffer.from(await finalPdfBlob.arrayBuffer());
            await uploadPdfToSupabase(fileName, finalPdfBuffer);
          }
          
          console.log(`Successfully exported COA for ${coaData.sampleName} with QR code`);
          
        } catch (error) {
          console.error(`Failed to export COA for ${coaData.sampleName}:`, error);
          logError(error, `Failed to export COA for ${coaData.sampleName}`);
          
          // Add an error PDF
          const pdf = new jsPDF({
            ...EXPORT_CONFIG.pdf,
            format: [210, 297]
          });
          pdf.setFontSize(16);
          pdf.text(`Error Exporting COA`, 20, 30);
          pdf.setFontSize(12);
          pdf.text(`Sample: ${coaData.sampleName}`, 20, 50);
          pdf.text(`Sample ID: ${coaData.sampleId}`, 20, 60);
          pdf.text(`Strain: ${coaData.strain}`, 20, 70);
          pdf.text(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 20, 90);
          pdf.text(`Please try exporting this COA individually.`, 20, 110);
          
          const fileName = `COA_${coaData.sampleName.replace(/[^a-z0-9]/gi, '_')}_${coaData.sampleId}_ERROR.pdf`;
          const pdfBlob = pdf.output('blob');
          coaFolder.file(fileName, pdfBlob);
        }
        
        // Small delay between COAs to prevent browser freezing
        if (i < coaDataArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setExportProgress(90);
      
      // Restore the original COA data
      updateCurrentCOA(originalCOAData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate and save ZIP
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const date = new Date().toISOString().split('T')[0];
      saveAs(content, `COA_Batch_${date}.zip`);
      
      setExportProgress(100);
      console.log('Bulk export completed successfully');
      
    } catch (error) {
      // Restore original COA on error
      updateCurrentCOA(originalCOAData);
      
      logError(error, 'Export all COAs');
      throw new COAError(
        'Failed to export COAs. Please try again.',
        ErrorType.EXPORT,
        error
      );
    } finally {
      // Reset state after a delay
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    }
  }, [renderCOAToCanvas]);
  
  // Wrap functions with error handling
  const safeHandlePrint = withErrorHandling(
    async () => handlePrint(),
    'Print COA'
  );
  
  const safeExportSinglePDF = withErrorHandling(
    exportSinglePDF,
    'Export single PDF'
  );
  
  const safeExportAllCOAs = withErrorHandling(
    exportAllCOAs,
    'Export all COAs'
  );
  
  return {
    componentRef: componentRef as React.RefObject<HTMLDivElement>,
    handlePrint: safeHandlePrint as () => void,
    exportSinglePDF: safeExportSinglePDF,
    exportAllCOAs: safeExportAllCOAs,
    isExporting,
    exportProgress
  };
}; 
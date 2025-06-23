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

export interface UseCOAExportReturn {
  componentRef: React.RefObject<HTMLDivElement>;
  handlePrint: () => void;
  exportSinglePDF: (coaData: COAData) => Promise<void>;
  exportAllCOAs: (coaDataArray: COAData[], renderCOACallback?: (coaData: COAData) => Promise<HTMLDivElement>) => Promise<void>;
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
  const renderCOAToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
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
  };
  
  // Export single COA as PDF
  const exportSinglePDF = useCallback(async (coaData: COAData): Promise<void> => {
    if (!componentRef.current) {
      throw new COAError('COA component not found', ErrorType.EXPORT);
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      setExportProgress(20);
      
      const canvas = await renderCOAToCanvas(componentRef.current);
      
      setExportProgress(60);
      
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
      
      setExportProgress(90);
      
      // Save the PDF
      const fileName = `COA_${coaData.sampleName.replace(/[^a-z0-9]/gi, '_')}_${coaData.sampleId}.pdf`;
      pdf.save(fileName);
      
      setExportProgress(100);
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
  }, []);
  
  // Export multiple COAs as ZIP
  const exportAllCOAs = useCallback(async (
    coaDataArray: COAData[], 
    renderCOACallback?: (coaData: COAData) => Promise<HTMLDivElement>
  ): Promise<void> => {
    if (coaDataArray.length === 0) {
      throw new COAError('No COAs to export', ErrorType.VALIDATION);
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    const zip = new JSZip();
    const coaFolder = zip.folder('COA_Batch');
    
    if (!coaFolder) {
      throw new COAError('Failed to create ZIP folder', ErrorType.EXPORT);
    }
    
    try {
      const progressPerCOA = 80 / coaDataArray.length;
      
      // Process each COA
      for (let i = 0; i < coaDataArray.length; i++) {
        const coaData = coaDataArray[i];
        
        // Update progress
        setExportProgress(Math.floor(i * progressPerCOA));
        
        if (renderCOACallback) {
          // Use the callback to render the COA properly
          try {
            const element = await renderCOACallback(coaData);
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
            const pdfBlob = pdf.output('blob');
            coaFolder.file(fileName, pdfBlob);
          } catch (error) {
            // If individual COA fails, log and continue
            logError(error, `Failed to export COA for ${coaData.sampleName}`);
            // Add a placeholder PDF
            const pdf = new jsPDF({
              ...EXPORT_CONFIG.pdf,
              format: [210, 297]
            });
            pdf.text(`Error exporting COA for ${coaData.sampleName}`, 20, 20);
            pdf.text(`Sample ID: ${coaData.sampleId}`, 20, 30);
            pdf.text(`Please export this COA individually.`, 20, 40);
            
            const fileName = `COA_${coaData.sampleName.replace(/[^a-z0-9]/gi, '_')}_${coaData.sampleId}_ERROR.pdf`;
            const pdfBlob = pdf.output('blob');
            coaFolder.file(fileName, pdfBlob);
          }
        } else {
          // Fallback to placeholder if no callback provided
          const pdf = new jsPDF({
            ...EXPORT_CONFIG.pdf,
            format: [210, 297]
          });
          
          pdf.text(`Certificate of Analysis for ${coaData.sampleName}`, 20, 20);
          pdf.text(`Sample ID: ${coaData.sampleId}`, 20, 30);
          pdf.text(`Please re-export this COA individually for full details.`, 20, 40);
          
          const fileName = `COA_${coaData.sampleName.replace(/[^a-z0-9]/gi, '_')}_${coaData.sampleId}.pdf`;
          const pdfBlob = pdf.output('blob');
          coaFolder.file(fileName, pdfBlob);
        }
        
        // Small delay to prevent browser freezing
        if (i < coaDataArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setExportProgress(90);
      
      // Generate and save ZIP
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const date = new Date().toISOString().split('T')[0];
      saveAs(content, `COA_Batch_${date}.zip`);
      
      setExportProgress(100);
    } catch (error) {
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
  }, []);
  
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
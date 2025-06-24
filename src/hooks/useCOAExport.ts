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
  logError 
} from '@/utils/errorHandling';
import { generateQrCode } from '@/lib/generateQrCode';
import { uploadPdfToSupabase } from '@/lib/uploadPdfToSupabase';

export interface UseCOAExportReturn {
  componentRef: React.RefObject<HTMLDivElement | null>;
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
  
    // Helper function to render COA to canvas
  const renderCOAToCanvas = async (element: HTMLDivElement): Promise<HTMLCanvasElement> => {
    try {
      // Prepare for PDF export (optimize colors)
      prepareForPdfExport(element);
      
      // Wait for any image loading or rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(element, {
        ...EXPORT_CONFIG.image,
        height: element.scrollHeight,
        width: element.scrollWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-coa-template]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.width = '210mm';
            clonedElement.style.minHeight = '297mm';
            clonedElement.style.padding = '0';
            clonedElement.style.margin = '0';
            clonedElement.style.boxSizing = 'border-box';
            clonedElement.style.fontSize = '12px';
            clonedElement.style.lineHeight = '1.4';
          }
        }
      });
      
      return canvas;
    } catch (error) {
      console.error('Canvas rendering error:', error);
      throw new COAError('Failed to render COA for export', ErrorType.EXPORT, error);
    }
  };
  
  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Certificate of Analysis',
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body { margin: 0; }
        .no-print { display: none !important; }
      }
    `
  });
  
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
      
      // Upload to Supabase first to get the lab site viewer URL
      const pdfBlob = pdf.output('blob');
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
      const publicUrl = await uploadPdfToSupabase(fileName, pdfBuffer);
      
      setExportProgress(80);
      
      // Generate QR code for the lab site viewer URL
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
      
    } catch (error) {
      console.error('Export error:', error);
      logError(error, 'Export single PDF');
      throw error instanceof COAError ? error : new COAError(
        'Failed to export PDF. Please try again.',
        ErrorType.EXPORT,
        error
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);
  
  // Export all COAs as ZIP file
  const exportAllCOAs = useCallback(async (coaDataArray: COAData[], currentCOAData: COAData, updateCurrentCOA: (data: COAData) => void): Promise<void> => {
    if (!componentRef.current) {
      throw new COAError('COA component not found', ErrorType.EXPORT);
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const zip = new JSZip();
      const coaFolder = zip.folder('COAs');
      
      if (!coaFolder) {
        throw new COAError('Failed to create ZIP folder', ErrorType.EXPORT);
      }
      
      const element = componentRef.current;
      
      for (let i = 0; i < coaDataArray.length; i++) {
        const coaData = coaDataArray[i];
        const progressPercent = Math.round(((i + 1) / coaDataArray.length) * 80);
        setExportProgress(progressPercent);
        
        // Update current COA for rendering
        updateCurrentCOA(coaData);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Render this COA
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
        
        // Upload to Supabase to get lab site viewer URL
        const pdfBlob = pdf.output('blob');
        const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
        const publicUrl = await uploadPdfToSupabase(fileName, pdfBuffer);
        
        // Generate QR code for the lab site viewer URL
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
          // Add to ZIP without QR code
          coaFolder.file(fileName, pdfBlob);
        }
      }
      
      setExportProgress(90);
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-T]/g, '');
      saveAs(zipBlob, `COAs_Export_${timestamp}.zip`);
      
      setExportProgress(100);
      
    } catch (error) {
      console.error('Batch export error:', error);
      logError(error, 'Export all COAs');
      throw error instanceof COAError ? error : new COAError(
        'Failed to export all COAs. Please try again.',
        ErrorType.EXPORT,
        error
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);
  
  return {
    componentRef,
    handlePrint,
    exportSinglePDF,
    exportAllCOAs,
    isExporting,
    exportProgress
  };
}; 
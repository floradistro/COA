import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { prepareForPdfExport } from '@/utils/colorConversion';
import { EXPORT_CONFIG } from '@/constants/defaults';

/**
 * Hook for PDF export functionality
 * Handles rendering COA template to canvas and converting to PDF
 */
export const usePDFExport = () => {
  // Wait for images to load before capture
  const waitForImages = useCallback(async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    if (images.length === 0) return;
    
    const imagePromises = Array.from(images).map(img => {
      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }
      
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 5000);
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };
      });
    });
    
    await Promise.all(imagePromises);
  }, []);

  // Render COA element to canvas
  const renderToCanvas = useCallback(async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    const cleanup = prepareForPdfExport(element);
    
    try {
      await waitForImages(element);
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
  }, [waitForImages]);

  // Convert canvas to PDF blob
  const canvasToPDF = useCallback((canvas: HTMLCanvasElement): Blob => {
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
    
    return pdf.output('blob');
  }, []);

  // Full export pipeline
  const exportToPDF = useCallback(async (element: HTMLElement): Promise<Buffer> => {
    const canvas = await renderToCanvas(element);
    const pdfBlob = canvasToPDF(canvas);
    return Buffer.from(await pdfBlob.arrayBuffer());
  }, [renderToCanvas, canvasToPDF]);

  return {
    renderToCanvas,
    canvasToPDF,
    exportToPDF
  };
};


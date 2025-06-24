'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source to use a reliable CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PDFPreviewProps {
  url: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function PDFPreview({ url, className = '', fallback }: PDFPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const renderPDF = async () => {
      if (!canvasRef.current || !url) return;

      try {
        setIsLoading(true);
        setHasError(false);

        // Configure PDF.js to handle CORS properly
        const loadingTask = pdfjsLib.getDocument({
          url: url,
          disableStream: true,
          disableAutoFetch: true,
        });
        
        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Set up the canvas
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate scale to fit the preview area
        const viewport = page.getViewport({ scale: 1.0 });
        const containerWidth = 280; // Approximate container width
        const containerHeight = 180; // Approximate container height
        const scale = Math.min(containerWidth / viewport.width, containerHeight / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';

        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
        setIsLoading(false);
      } catch (error) {
        console.error('Error rendering PDF preview:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    // Add a small delay to prevent overwhelming the browser
    const timeoutId = setTimeout(renderPDF, 100);
    return () => clearTimeout(timeoutId);
  }, [url]);

  if (hasError) {
    return (
      fallback || (
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-3">
            <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">PDF Document</p>
        </div>
      )
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-lg shadow-sm ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
} 
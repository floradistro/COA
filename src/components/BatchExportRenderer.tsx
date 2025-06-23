'use client';

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import COATemplate from './COATemplate';
import { COAData } from '@/types';

export interface BatchExportRendererHandle {
  renderCOA: (coaData: COAData) => Promise<HTMLDivElement>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface BatchExportRendererProps {}

const BatchExportRenderer = forwardRef<BatchExportRendererHandle, BatchExportRendererProps>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentCOA, setCurrentCOA] = useState<COAData | null>(null);
  
  useImperativeHandle(ref, () => ({
    renderCOA: async (coaData: COAData): Promise<HTMLDivElement> => {
      if (!containerRef.current) {
        throw new Error('Container ref not available');
      }
      
      return new Promise((resolve, reject) => {
        try {
          // Set the COA data to trigger re-render
          setCurrentCOA(coaData);
          
          // Wait for React to render and all images to load
          const checkRenderComplete = () => {
            const container = containerRef.current;
            if (!container) {
              reject(new Error('Container not found'));
              return;
            }
            
            const coaElement = container.querySelector('[data-coa-template]') as HTMLDivElement;
            if (!coaElement) {
              reject(new Error('COA template not found'));
              return;
            }
            
            // Check if all images are loaded
            const images = coaElement.querySelectorAll('img');
            const allImagesLoaded = Array.from(images).every(img => {
              return img.complete && img.naturalHeight !== 0;
            });
            
            if (allImagesLoaded) {
              resolve(coaElement);
            } else {
              // Wait a bit more for images to load
              setTimeout(checkRenderComplete, 100);
            }
          };
          
          // Start checking after initial render
          setTimeout(checkRenderComplete, 100);
          
        } catch (error) {
          reject(error);
        }
      });
    }
  }));
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'absolute',
        left: '-9999px',
        top: '0px',
        width: '794px',
        height: 'auto',
        background: 'white',
        visibility: 'hidden',
        pointerEvents: 'none'
      }}
    >
      {currentCOA && <COATemplate data={currentCOA} />}
    </div>
  );
});

BatchExportRenderer.displayName = 'BatchExportRenderer';

export default BatchExportRenderer; 
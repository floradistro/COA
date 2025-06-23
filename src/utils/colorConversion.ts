/**
 * Color conversion utilities for handling OKLCH to RGB conversion
 * This is needed for html2canvas compatibility
 */

// Cache for converted colors to avoid repeated DOM manipulations
const colorCache = new Map<string, string>();

// Development mode flag
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Converts a color value to RGB format using the browser's computed style
 * @param colorValue - The color value to convert (e.g., 'oklch(...)')
 * @returns The RGB color value or the original value if conversion fails
 */
export const convertColorToRgb = (colorValue: string): string => {
  // Check if value needs conversion
  if (!colorValue || 
      colorValue === 'transparent' || 
      colorValue === 'rgba(0, 0, 0, 0)' || 
      !colorValue.includes('oklch')) {
    return colorValue;
  }
  
  // Check cache first
  if (colorCache.has(colorValue)) {
    return colorCache.get(colorValue)!;
  }
  
  try {
    // Create a temporary element to compute the RGB value
    const temp = document.createElement('div');
    temp.style.cssText = `
      position: absolute;
      visibility: hidden;
      pointer-events: none;
      color: ${colorValue};
    `;
    
    document.body.appendChild(temp);
    const rgb = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);
    
    // Cache the result
    colorCache.set(colorValue, rgb);
    
    return rgb;
  } catch (error) {
    // Only log in development
    if (isDevelopment) {
      console.warn('Failed to convert color:', colorValue, error);
    }
    return colorValue;
  }
};

/**
 * Converts all OKLCH colors in an element's style to RGB
 * @param element - The HTML element to process
 */
export const convertElementColors = (element: HTMLElement): void => {
  if (!element) return;
  
  try {
    const computedStyle = window.getComputedStyle(element);
    
    // List of color properties to check
    const colorProperties = [
      'backgroundColor',
      'color',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderColor',
      'outlineColor',
      'textDecorationColor',
      'textEmphasisColor',
      'caretColor',
      'columnRuleColor'
    ] as const;
    
    // Convert each color property
    colorProperties.forEach(prop => {
      try {
        const value = computedStyle[prop as keyof CSSStyleDeclaration];
        if (value && typeof value === 'string' && value.includes('oklch')) {
          const rgbValue = convertColorToRgb(value);
          if (rgbValue !== value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (element.style as any)[prop] = rgbValue;
          }
        }
      } catch (error) {
        // Silently ignore property-specific errors
        if (isDevelopment) {
          console.debug(`Skipping ${prop} conversion:`, error);
        }
      }
    });
    
    // Process child elements recursively
    Array.from(element.children).forEach(child => {
      convertElementColors(child as HTMLElement);
    });
  } catch (error) {
    // Silently handle errors in production
    if (isDevelopment) {
      console.debug('Error in convertElementColors:', error);
    }
  }
};

/**
 * Prepares an element for PDF export by converting all OKLCH colors
 * @param element - The root element to prepare
 * @returns Cleanup function to restore original styles
 */
export const prepareForPdfExport = (element: HTMLElement): (() => void) => {
  // Store original styles for restoration
  const originalStyles = new Map<HTMLElement, string>();
  
  const storeAndConvert = (el: HTMLElement) => {
    // Store original style
    originalStyles.set(el, el.getAttribute('style') || '');
    
    // Convert colors
    convertElementColors(el);
  };
  
  try {
    // Process the element and all its descendants
    storeAndConvert(element);
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => storeAndConvert(el as HTMLElement));
    
    // Add PDF export class for additional CSS overrides
    element.classList.add('pdf-export');
  } catch (error) {
    if (isDevelopment) {
      console.error('Error preparing for PDF export:', error);
    }
  }
  
  // Return cleanup function
  return () => {
    try {
      // Restore original styles
      originalStyles.forEach((style, el) => {
        if (style) {
          el.setAttribute('style', style);
        } else {
          el.removeAttribute('style');
        }
      });
      
      // Remove PDF export class
      element.classList.remove('pdf-export');
      
      // Clear the stored styles
      originalStyles.clear();
    } catch (error) {
      if (isDevelopment) {
        console.error('Error cleaning up after PDF export:', error);
      }
    }
  };
};

/**
 * Clears the color cache
 */
export const clearColorCache = (): void => {
  colorCache.clear();
};

/**
 * Gets the current size of the color cache
 * @returns The number of cached color conversions
 */
export const getColorCacheSize = (): number => {
  return colorCache.size;
}; 
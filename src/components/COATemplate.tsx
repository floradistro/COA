import React, { forwardRef, memo, useMemo } from 'react';
import { COAData, ComprehensiveValidationResult } from '@/types';
import { 
  calculateSumOfCannabinoids,
  percentToMgPerG
} from '@/utils';
import { DECARB_FACTOR } from '@/constants';

interface COATemplateProps {
  data: COAData;
  // Navigation props for multi-COA scenarios
  isMultiStrain?: boolean;
  generatedCOAs?: COAData[];
  currentCOAIndex?: number;
  onNavigateCOA?: (index: number) => void;
  // Validation props
  validationResult?: ComprehensiveValidationResult;
  // Preview mode flag
  isPreviewMode?: boolean;
}

// Pie Chart Component - Memoized
const CannabinoidPieChart = memo(({ data }: { data: COAData }) => {
  // Calculate values for the pie chart
  const getChartData = () => {
    const thca = data.cannabinoids.find(c => c.name === 'THCa')?.percentWeight || 0;
    const d9thc = data.cannabinoids.find(c => c.name === 'Δ9-THC')?.percentWeight || 0;
    const cbd = data.cannabinoids.find(c => c.name === 'CBD')?.percentWeight || 0;
    const cbda = data.cannabinoids.find(c => c.name === 'CBDa')?.percentWeight || 0;
    
    // Calculate total CBD using the formula
    const totalCBD = cbd + (cbda * DECARB_FACTOR);
    
    // Get individual minor cannabinoids
    const cbg = data.cannabinoids.find(c => c.name === 'CBG')?.percentWeight || 0;
    const cbga = data.cannabinoids.find(c => c.name === 'CBGa')?.percentWeight || 0;
    const cbc = data.cannabinoids.find(c => c.name === 'CBC')?.percentWeight || 0;
    const cbn = data.cannabinoids.find(c => c.name === 'CBN')?.percentWeight || 0;
    const thcv = data.cannabinoids.find(c => c.name === 'THCV')?.percentWeight || 0;
    
    // Calculate other cannabinoids (remaining ones not explicitly shown)
    const otherCannabinoids = data.cannabinoids
      .filter(c => !['THCa', 'Δ9-THC', 'CBD', 'CBDa', 'CBG', 'CBGa', 'CBC', 'CBN', 'THCV'].includes(c.name))
      .reduce((sum, c) => {
        if (c.result === 'detected' && c.percentWeight > 0) {
          return sum + c.percentWeight;
        }
        return sum;
      }, 0);
    
    const total = thca + d9thc + totalCBD + cbg + cbga + cbc + cbn + thcv + otherCannabinoids;
    
    if (total === 0) return [];
    
    // Add slight variations to slice angles
    const angleVariation = () => (Math.random() - 0.5) * 2; // -1 to 1 degree variation
    
    // Build chart data - only include cannabinoids that are detected
    const chartData = [];
    
    if (thca > 0) {
      chartData.push({ 
        name: 'THCa', 
        value: thca, 
        percentage: (thca / total * 100) + angleVariation(),
        displayValue: `${thca.toFixed(2)}%`,
        color: '#10B981' 
      });
    }
    
    if (d9thc > 0) {
      chartData.push({ 
        name: 'D9 THC', 
        value: d9thc, 
        percentage: (d9thc / total * 100) + angleVariation(),
        displayValue: `${d9thc.toFixed(2)}%`,
        color: '#F59E0B' 
      });
    }
    
    if (totalCBD > 0) {
      chartData.push({ 
        name: 'Total CBD', 
        value: totalCBD, 
        percentage: (totalCBD / total * 100) + angleVariation(),
        displayValue: `${totalCBD.toFixed(2)}%`,
        color: '#3B82F6' 
      });
    }
    
    if (cbga > 0) {
      chartData.push({ 
        name: 'CBGa', 
        value: cbga, 
        percentage: (cbga / total * 100) + angleVariation(),
        displayValue: `${cbga.toFixed(2)}%`,
        color: '#8B5CF6' 
      });
    }
    
    if (cbg > 0) {
      chartData.push({ 
        name: 'CBG', 
        value: cbg, 
        percentage: (cbg / total * 100) + angleVariation(),
        displayValue: `${cbg.toFixed(2)}%`,
        color: '#EC4899' 
      });
    }
    
    if (cbc > 0 || cbn > 0 || thcv > 0 || otherCannabinoids > 0) {
      const otherTotal = cbc + cbn + thcv + otherCannabinoids;
      chartData.push({ 
        name: 'Other', 
        value: otherTotal, 
        percentage: (otherTotal / total * 100) + angleVariation(),
        displayValue: `${otherTotal.toFixed(2)}%`,
        color: '#6B7280' 
      });
    }
    
    return chartData;
  };

  const chartData = getChartData();
  
  if (chartData.length === 0) return null;

  // Create pie slices
  const createPieSlices = () => {
    const centerX = 70;
    const centerY = 70;
    const radius = 50;
    let currentAngle = -90; // Start from top
    
    return chartData.map((item, index) => {
      const angle = (item.percentage / 100) * 360;
      const startAngleRad = (currentAngle * Math.PI) / 180;
      const endAngleRad = ((currentAngle + angle) * Math.PI) / 180;
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      currentAngle += angle;
      
      return (
        <path
          key={index}
          d={pathData}
          fill={item.color}
          stroke="white"
          strokeWidth="1.5"
          className="hover:opacity-80 transition-opacity"
        />
      );
    });
  };

  // Get minor cannabinoids for detail panel
  const getMinorCannabinoidDetails = () => {
    const minorCannabinoids: { name: string; value: string }[] = [];
    
    data.cannabinoids.forEach(c => {
      if (['CBG', 'CBGa', 'CBC', 'CBN', 'THCV', 'CBDa'].includes(c.name) && c.result === 'detected' && c.percentWeight > 0) {
        minorCannabinoids.push({
          name: c.name,
          value: c.percentWeight.toFixed(2)
        });
      }
    });
    
    return minorCannabinoids;
  };

  const minorDetails = getMinorCannabinoidDetails();

  return (
    <div>
      <div className="flex items-center">
        {/* Pie Chart */}
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {createPieSlices()}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="space-y-1.5 -ml-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="text-xs">
                <span className="font-medium text-gray-900">{item.name}</span>
                <div className="text-gray-600 text-xs">
                  {item.displayValue}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Minor Cannabinoid Panel */}
      {minorDetails.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-[9px] font-medium text-gray-900 mb-1">Minor Cannabinoids</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8px]">
            {minorDetails.map((minor, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-700">{minor.name}:</span>
                <span className="font-medium text-gray-900">{minor.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

CannabinoidPieChart.displayName = 'CannabinoidPieChart';

const COATemplate = forwardRef<HTMLDivElement, COATemplateProps>(({ 
  data, 
  isMultiStrain = false,
  generatedCOAs = [],
  currentCOAIndex = 0,
  onNavigateCOA,
  validationResult,
  isPreviewMode = false
}, ref) => {
  // Memoize expensive calculations
  const calculatedValues = useMemo(() => {
    const thca = data.cannabinoids.find(c => c.name === 'THCa')?.percentWeight || 0;
    const d9thc = data.cannabinoids.find(c => c.name === 'Δ9-THC')?.percentWeight || 0;
    const cbda = data.cannabinoids.find(c => c.name === 'CBDa')?.percentWeight || 0;
    const cbd = data.cannabinoids.find(c => c.name === 'CBD')?.percentWeight || 0;
    
    // Use pre-calculated totalTHC if available (for edibles), otherwise calculate it
    const totalTHC = data.totalTHC !== undefined && data.totalTHC !== null 
      ? data.totalTHC.toFixed(3)
      : (d9thc + (thca * DECARB_FACTOR)).toFixed(2);
    
    // Use pre-calculated totalCBD if available, otherwise calculate it
    const totalCBD = data.totalCBD !== undefined && data.totalCBD !== null
      ? data.totalCBD.toFixed(2)
      : (cbd + (cbda * DECARB_FACTOR)).toFixed(2);
    
    const sumOfCannabinoids = calculateSumOfCannabinoids(data.cannabinoids).toFixed(2);
    
    return {
      totalTHC,
      totalCBD,
      sumOfCannabinoids
    };
  }, [data.cannabinoids, data.totalTHC, data.totalCBD]);
  
  
  const formatMgPerG = (percentValue: number | string) => {
    const numValue = typeof percentValue === 'string' ? parseFloat(percentValue) : percentValue;
    return percentToMgPerG(numValue).toFixed(2);
  };

  const totalCBDValue = calculatedValues.totalCBD;
  const sumOfCannabinoids = calculatedValues.sumOfCannabinoids;

  return (
    <div ref={ref} data-coa-template className="coa-template bg-white text-[10px] leading-tight">
      {/* Preview Header Bar - Only show in preview mode */}
      {isPreviewMode && (
        <div className="preview-header-bar bg-gray-50 border-b border-gray-200 p-4 mb-4 rounded-t-lg" style={{ 
          fontSize: '14px', 
          lineHeight: '1.4',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div className="flex items-center justify-between">
            {/* Left side - Navigation for multiple COAs */}
            <div className="flex items-center gap-4">
              {isMultiStrain && generatedCOAs.length > 1 && onNavigateCOA && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigateCOA(currentCOAIndex - 1)}
                    disabled={currentCOAIndex === 0}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-gray-700 px-2">
                    COA {currentCOAIndex + 1} of {generatedCOAs.length}
                  </span>
                  <button
                    onClick={() => onNavigateCOA(currentCOAIndex + 1)}
                    disabled={currentCOAIndex === generatedCOAs.length - 1}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Validation Status */}
            <div className="flex items-center gap-3">
              {validationResult && (
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Valid COA</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="font-medium">
                        {validationResult.errors.length} error{validationResult.errors.length !== 1 ? 's' : ''}
                        {validationResult.warnings.length > 0 && (
                          <span className="text-yellow-600 ml-1">
                            , {validationResult.warnings.length} warning{validationResult.warnings.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .coa-template {
          width: 794px !important;
          margin: 0 auto !important;
          padding: 8px !important;
          box-sizing: border-box !important;
          font-size: 10px !important;
          line-height: 1.3 !important;
          background: white !important;
          text-align: center !important;
          min-width: 794px !important;
          flex-shrink: 0 !important;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .coa-template {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 5mm !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
            page-break-inside: avoid !important;
            transform: none !important;
            box-shadow: none !important;
            text-align: center !important;
          }
          
          .coa-template table td,
          .coa-template table th {
            vertical-align: middle !important;
            text-align: center !important;
            display: table-cell !important;
          }
          
          .coa-template table td {
            height: 24px !important;
            line-height: 16px !important;
            padding: 4px 6px !important;
          }
          
          .coa-template table th {
            height: 32px !important;
            line-height: 18px !important;
            padding: 6px 6px !important;
          }
          
          .coa-template table th:first-child,
          .coa-template table td:first-child {
            text-align: left !important;
            vertical-align: middle !important;
          }
        }

        .coa-template table {
          table-layout: fixed !important;
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 0 auto !important;
        }
        
        .coa-template .cannabinoid-table-container {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }
        
        .coa-template .summary-container {
          width: 192px !important;
          flex-shrink: 0 !important;
        }

        .coa-template table td,
        .coa-template table th {
          box-sizing: border-box !important;
          vertical-align: middle !important;
          border: 1px solid #e5e7eb !important;
          text-align: center !important;
          line-height: normal !important;
        }
        
        .coa-template table td {
          height: 24px !important;
          min-height: 24px !important;
          padding: 4px 6px !important;
          vertical-align: middle !important;
          line-height: 16px !important;
        }
        
        .coa-template table th {
          height: 32px !important;
          min-height: 32px !important;
          padding: 6px 6px !important;
          vertical-align: middle !important;
          line-height: 18px !important;
        }

        .coa-template table th:first-child,
        .coa-template table td:first-child {
          padding-left: 8px !important;
          padding-right: 8px !important;
          text-align: left !important;
          vertical-align: middle !important;
        }

        .coa-template .coa-section {
          text-align: center !important;
        }

        .coa-template .sample-info-grid {
          text-align: left !important;
        }

        .coa-template .header-section {
          text-align: left !important;
        }

        .coa-template .footer-section {
          text-align: left !important;
        }

        /* Preserve colors for print and export */
        .coa-template * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Ensure consistent font rendering */
        .coa-template {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
        
        /* Force background colors */
        .coa-template .bg-gray-50 { background-color: #f9fafb !important; }
        .coa-template .bg-gray-100 { background-color: #f3f4f6 !important; }
        .coa-template .bg-green-50 { background-color: #f0fdf4 !important; }
        .coa-template .bg-white { background-color: #ffffff !important; }
        
        /* Force border colors */
        .coa-template .border-green-500 { border-color: #10b981 !important; }
        .coa-template .border-gray-200 { border-color: #e5e7eb !important; }
        .coa-template .border-gray-300 { border-color: #d1d5db !important; }
        
        /* Force text colors */
        .coa-template .text-green-700 { color: #15803d !important; }
        .coa-template .text-gray-700 { color: #374151 !important; }
        .coa-template .text-gray-800 { color: #1f2937 !important; }
        .coa-template .text-gray-900 { color: #111827 !important; }
        .coa-template .text-black { color: #000000 !important; }
        
        /* Ensure images don't break layout */
        .coa-template img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
      `}} />

      {/* Header Section */}
      <div className="coa-section header-section flex justify-between items-start mb-2 border-b border-gray-200 pb-2">
        <div className="flex-1 flex items-start gap-4">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/quantixlogo.png" 
                  alt="Quantix Analytics Logo"
                  className="w-20 h-20 object-contain"
                  loading="eager"
                  onError={(e) => {
                    // Fallback to gradient logo if image fails to load
                    const target = e.currentTarget as HTMLImageElement;
                    const fallback = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                  onLoad={(e) => {
                    // Ensure image is visible when loaded
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.opacity = '1';
                  }}
                  style={{ opacity: '0.9' }}
                />
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full hidden items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-3xl font-bold text-black leading-tight">
                  <span>Quantix</span>
                </div>
                <div className="text-2xl font-medium text-black -mt-1">
                  <span>Analytics</span>
                </div>
              </div>
              <div className="h-16 w-px bg-gray-300 mx-2"></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] text-gray-800 whitespace-pre-line leading-tight">
                  {data.labContact}
                </div>
              </div>
            </div>
            <div className="text-base text-gray-800 leading-tight mt-2 ml-2">Certificate of Analysis</div>
          </div>
        </div>
        
        {/* Client info in header - only when image mode is active */}
        {data.includeImage && data.productImageUrl && (
          <div className="text-left text-[10px] leading-tight ml-4">
            <div className="space-y-0.5">
              <div><span className="font-medium text-gray-900">Client:</span></div>
              <div className="font-medium text-gray-800">{data.clientName}</div>
              <div className="whitespace-pre-line text-gray-800">{data.clientAddress}</div>
              <div><span className="font-medium text-gray-900">Lic #:</span> <span className="text-gray-800">{data.licenseNumber}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Sample Information and Pie Chart Section */}
      <div className="coa-section mb-2">
        <div className="flex gap-6 mb-4 mr-4">
          {/* Sample Information - Left Side */}
          <div className="flex-1 grid grid-cols-4 gap-4 sample-info-grid">
            <div>
              <h2 className="text-xs font-bold text-gray-900 mb-1">{data.sampleName}</h2>
              <div className="space-y-0.5 text-[10px] leading-tight">
                <div><span className="font-medium text-gray-900">Sample ID:</span> <span className="text-gray-800">{data.sampleId}</span></div>
                <div><span className="font-medium text-gray-900">{data.sampleType === 'Cannabis Edible' ? 'Product Name:' : 'Strain:'}</span> <span className="text-gray-800">{data.strain}</span></div>
                <div><span className="font-medium text-gray-900">Matrix:</span> <span className="text-gray-800">{data.sampleType === 'Cannabis Edible' ? 'Infused Product' : 'Plant'}</span></div>
                <div><span className="font-medium text-gray-900">Type:</span> <span className="text-gray-800">{data.sampleType}</span></div>
                <div><span className="font-medium text-gray-900">Sample Size:</span> <span className="text-gray-800">{data.sampleSize}</span></div>
              </div>
            </div>
            
            <div className="text-[10px] leading-tight">
              <div className="space-y-0.5">
                <div><span className="font-medium text-gray-900">Produced:</span></div>
                <div><span className="font-medium text-gray-900">Collected:</span> <span className="text-gray-800">{data.dateCollected}</span></div>
                <div><span className="font-medium text-gray-900">Received:</span> <span className="text-gray-800">{data.dateReceived}</span></div>
                <div><span className="font-medium text-gray-900">Completed:</span> <span className="text-gray-800">{data.dateTested}</span></div>
                <div><span className="font-medium text-gray-900">Batch#:</span> <span className="text-gray-800">{data.batchId}</span></div>
              </div>
            </div>
            
            {/* Client info or Product Image */}
            {data.includeImage && data.productImageUrl ? (
              <div className="text-[10px] leading-tight">
                <div className="space-y-0.5">
                  <div><span className="font-medium text-gray-900">Photo of Sample:</span></div>
                  <div className="mt-1 flex items-start justify-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={data.productImageUrl} 
                      alt="Product Sample"
                      className="max-w-full object-contain border border-gray-300 rounded"
                      style={{
                        maxWidth: '150px',
                        maxHeight: '110px'
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[10px] leading-tight">
                <div className="space-y-0.5">
                  <div><span className="font-medium text-gray-900">Client:</span></div>
                  <div className="font-medium text-gray-800">{data.clientName}</div>
                  <div className="whitespace-pre-line text-gray-800">{data.clientAddress}</div>
                  <div><span className="font-medium text-gray-900">Lic #:</span> <span className="text-gray-800">{data.licenseNumber}</span></div>
                </div>
              </div>
            )}
            
            {/* Pie Chart - Fourth Column */}
            <div className="text-[10px] leading-tight pr-2">
              <div><span className="font-bold text-gray-900">Cannabinoid Distribution</span></div>
              <div className="mt-1">
                <CannabinoidPieChart data={data} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cannabinoids Section */}
      <div className="coa-section mb-2">
        
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold text-gray-900">Cannabinoids</h3>
          <div className="text-right text-[10px] text-gray-800">Complete</div>
        </div>
        
        {/* Cannabinoid Table and Summary Layout */}
        <div className="flex gap-3 justify-center">
          {/* Cannabinoid Table */}
          <div className="cannabinoid-table-container flex-1 overflow-hidden border border-gray-200 rounded">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex" style={{ minHeight: '32px' }}>
                <div className="w-[30%] px-2 border-r border-gray-200 text-left font-medium text-gray-900 flex items-center" style={{ height: '32px', paddingTop: '6px', paddingBottom: '6px' }}>Analyte</div>
                <div className="w-[15%] px-2 border-r border-gray-200 text-center font-medium text-gray-900 flex flex-col items-center justify-center" style={{ height: '32px', paddingTop: '6px', paddingBottom: '6px' }}>
                  <div>LOD</div>
                  <div className="text-[9px]">mg/g</div>
                </div>
                <div className="w-[15%] px-2 border-r border-gray-200 text-center font-medium text-gray-900 flex flex-col items-center justify-center" style={{ height: '32px', paddingTop: '6px', paddingBottom: '6px' }}>
                  <div>LOQ</div>
                  <div className="text-[9px]">mg/g</div>
                </div>
                <div className="w-[20%] px-2 border-r border-gray-200 text-center font-medium text-gray-900 flex flex-col items-center justify-center" style={{ height: '32px', paddingTop: '6px', paddingBottom: '6px' }}>
                  <div>Result</div>
                  <div className="text-[9px]">%</div>
                </div>
                <div className="w-[20%] px-2 text-center font-medium text-gray-900 flex flex-col items-center justify-center" style={{ height: '32px', paddingTop: '6px', paddingBottom: '6px' }}>
                  <div>Result</div>
                  <div className="text-[9px]">mg/g</div>
                </div>
              </div>
            </div>
            
            {/* Table Body */}
            <div className="text-[10px]">
              {data.cannabinoids.map((cannabinoid, index) => (
                <div key={index} className={`flex border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} style={{ minHeight: '24px' }}>
                  <div className="w-[30%] px-2 border-r border-gray-200 font-medium text-gray-900 text-left flex items-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{cannabinoid.name}</div>
                  <div className="w-[15%] px-2 border-r border-gray-200 text-center text-gray-800 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{cannabinoid.lod.toFixed(2)}</div>
                  <div className="w-[15%] px-2 border-r border-gray-200 text-center text-gray-800 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{cannabinoid.loq.toFixed(2)}</div>
                  <div className="w-[20%] px-2 border-r border-gray-200 text-center font-medium text-gray-900 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>
                    {cannabinoid.result === 'ND' ? 'ND' : 
                     cannabinoid.result === '< LOQ' ? `<${cannabinoid.loq.toFixed(1)}` : 
                     cannabinoid.percentWeight.toFixed(2)}
                  </div>
                  <div className="w-[20%] px-2 text-center text-gray-800 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>
                    {cannabinoid.result === 'ND' ? 'ND' : 
                     cannabinoid.result === '< LOQ' ? `<${(cannabinoid.loq * 10).toFixed(1)}` : 
                     cannabinoid.mgPerG.toFixed(2)}
                  </div>
                </div>
              ))}
              
              {/* Summary Rows */}
              <div className="flex border-b border-gray-200 bg-gray-100 font-medium" style={{ minHeight: '24px' }}>
                <div className="w-[30%] px-2 border-r border-gray-200 text-gray-900 text-left flex items-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>Total THC</div>
                <div className="w-[15%] px-2 border-r border-gray-200" style={{ height: '24px' }}></div>
                <div className="w-[15%] px-2 border-r border-gray-200" style={{ height: '24px' }}></div>
                <div className="w-[20%] px-2 border-r border-gray-200 text-center text-gray-900 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{calculatedValues.totalTHC}</div>
                <div className="w-[20%] px-2 text-center text-gray-800 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{formatMgPerG(calculatedValues.totalTHC)}</div>
              </div>
              
              <div className="flex border-b border-gray-200 bg-gray-100 font-medium" style={{ minHeight: '24px' }}>
                <div className="w-[30%] px-2 border-r border-gray-200 text-gray-900 text-left flex items-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>Total CBD</div>
                <div className="w-[15%] px-2 border-r border-gray-200" style={{ height: '24px' }}></div>
                <div className="w-[15%] px-2 border-r border-gray-200" style={{ height: '24px' }}></div>
                <div className="w-[20%] px-2 border-r border-gray-200 text-center text-gray-900 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{totalCBDValue !== '0.00' ? totalCBDValue : 'ND'}</div>
                <div className="w-[20%] px-2 text-center text-gray-800 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{totalCBDValue !== '0.00' ? formatMgPerG(totalCBDValue) : 'ND'}</div>
              </div>
              
              <div className="flex bg-gray-100 font-medium" style={{ minHeight: '24px' }}>
                <div className="w-[30%] px-2 border-r border-gray-200 text-gray-900 text-left flex items-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>Total Cannabinoids (Sum)</div>
                <div className="w-[15%] px-2 border-r border-gray-200" style={{ height: '24px' }}></div>
                <div className="w-[15%] px-2 border-r border-gray-200" style={{ height: '24px' }}></div>
                <div className="w-[20%] px-2 border-r border-gray-200 text-center text-gray-900 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{sumOfCannabinoids}</div>
                <div className="w-[20%] px-2 text-center text-gray-800 flex items-center justify-center" style={{ height: '24px', paddingTop: '4px', paddingBottom: '4px' }}>{formatMgPerG(sumOfCannabinoids)}</div>
              </div>
            </div>
          </div>

          {/* Summary Boxes and Summary Table */}
          <div className="summary-container w-48 space-y-2">
            <div className="border-2 border-green-500 bg-green-50 p-2 text-center rounded">
              <div className="text-lg font-bold text-green-700">{calculatedValues.totalTHC}%</div>
              <div className="text-[10px] font-medium text-green-700 leading-tight">Total THC</div>
            </div>
            <div className={`border-2 ${totalCBDValue !== '0.00' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'} p-2 text-center rounded`}>
              <div className={`text-lg font-bold ${totalCBDValue !== '0.00' ? 'text-green-700' : 'text-gray-700'}`}>
                {totalCBDValue !== '0.00' ? `${totalCBDValue}%` : 'ND'}
              </div>
              <div className={`text-[10px] font-medium leading-tight ${totalCBDValue !== '0.00' ? 'text-green-700' : 'text-gray-700'}`}>Total CBD</div>
            </div>
            <div className="border-2 border-green-500 bg-green-50 p-2 text-center rounded">
              <div className="text-lg font-bold text-green-700">{sumOfCannabinoids}%</div>
              <div className="text-[10px] font-medium text-green-700 leading-tight">Total Cannabinoids</div>
            </div>
            
            {/* Summary Table */}
            <div className="mt-3">
              <h3 className="text-xs font-bold text-gray-900 mb-1">Summary</h3>
              <div className="overflow-hidden border border-gray-200 rounded">
                <table className="w-full text-[7px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-0.5 py-0.5 text-left font-medium text-gray-900 text-[7px] leading-tight">Test</th>
                      <th className="px-0.5 py-0.5 text-center font-medium text-gray-900 text-[7px] leading-tight">Date<br/>Tested</th>
                      <th className="px-0.5 py-0.5 text-center font-medium text-gray-900 text-[7px] leading-tight">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-white">
                      <td className="px-0.5 py-0.5 font-medium text-gray-900 text-left text-[7px] leading-tight">Batch</td>
                      <td className="px-0.5 py-0.5 text-center text-gray-800 text-[7px] leading-tight">{data.testsBatch ? data.dateTested : '—'}</td>
                      <td className="px-0.5 py-0.5 text-center text-gray-800 text-[7px] leading-tight">{data.testsBatch ? 'Complete' : 'Not Submitted'}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-0.5 py-0.5 font-medium text-gray-900 text-left text-[7px] leading-tight">Cannabinoids</td>
                      <td className="px-0.5 py-0.5 text-center text-gray-800 text-[7px] leading-tight">{data.testsCannabinoids ? data.dateTested : '—'}</td>
                      <td className="px-0.5 py-0.5 text-center text-gray-800 text-[7px] leading-tight">{data.testsCannabinoids ? 'Complete' : 'Not Tested'}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-0.5 py-0.5 font-medium text-gray-900 text-left text-[7px] leading-tight">Moisture</td>
                      <td className="px-0.5 py-0.5 text-center text-gray-800 text-[7px] leading-tight">{data.testsMoisture ? data.dateTested : '—'}</td>
                      <td className="px-0.5 py-0.5 text-center text-gray-800 text-[7px] leading-tight">{data.testsMoisture ? `${data.moisture?.toFixed(2) || '0.00'}%` : 'Not Tested'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="coa-section mb-2 text-[9px]">
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="font-medium mb-1 text-gray-900">{data.notes}</div>
          <div className="text-gray-800 leading-tight" style={{fontSize: '8px', lineHeight: '11px'}}>
            <div>Total THC = Δ9-THC + 0.877 * THCa</div>
            <div>Total CBD = CBD + 0.877 * CBDa</div>
            <div>*Total Cannabinoids = Sum of individual cannabinoids detected. Other Detected: The reported result is based on a sample weight with the applicable moisture content for that sample. Unless otherwise stated all quality control samples performed within specifications established by the Laboratory. HL105.10-01. Cannabinoid Testing: Pass/Fail status determined based on thresholds established under North Carolina hemp regulations and federal Farm Bill limits.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="coa-section footer-section border-t border-gray-200 pt-2">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <div className="float-left mr-2 mb-1">
              {data.qrCodeDataUrl ? (
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    key={data.qrCodeDataUrl} 
                    src={data.qrCodeDataUrl} 
                    alt="QR Code for COA" 
                    className="w-16 h-16 border border-gray-300 bg-white p-0.5"
                    style={{ 
                      imageRendering: 'auto',
                      minWidth: '64px',
                      minHeight: '64px',
                      maxWidth: '64px',
                      maxHeight: '64px'
                    }}
                  />
                  <div className="text-center text-[9px] text-gray-800 mt-0.5 leading-tight">Scan for digital copy</div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-200 border border-gray-300"></div>
                  <div className="text-center text-[9px] text-gray-800 mt-0.5 leading-tight">QR Code</div>
                </div>
              )}
            </div>
            <div className="text-gray-800 leading-tight" style={{fontSize: '8px', lineHeight: '11px'}}>
              <div>Quantix Analytics performs analytical testing using validated internal methodologies and quality control protocols. All results apply only to the sample(s) tested. This Certificate is not a declaration of product safety, efficacy, or regulatory compliance, and should not be construed as state or federal endorsement. Testing is performed in accordance with North Carolina Department of Agriculture & Consumer Services (NCDA&CS) guidance and fully complies with the federal USDA Domestic Hemp Production Program (7 CFR Part 990).</div>
              <div className="mt-1">This report may not be reproduced except in full without written approval from Quantix Analytics.</div>
              <div className="mt-1">For inquiries, contact support@quantixanalytics.com | Raleigh, NC | www.quantixanalytics.com</div>
            </div>
          </div>
          
          <div className="text-right text-[9px] leading-tight">
            <div className="mb-1">
              <div className="font-medium text-gray-900">Quantix Analytics</div>
              <div className="text-gray-800">All Rights Reserved</div>
              <div className="text-gray-800">support@quantixanalytics.com</div>
              <div className="text-gray-800">www.quantixanalytics.com</div>
            </div>
            <div className="border-t border-gray-300 pt-1 mt-1">
              <div className="flex items-center justify-end gap-2">
                {data.labDirector === 'Sarah Mitchell' && (
                  <div className="flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/sarah-mitchell-signature.png" 
                      alt="Sarah Mitchell Signature"
                      className="h-48 w-auto object-contain"
                      style={{ 
                        maxHeight: '192px',
                        maxWidth: '480px'
                      }}
                    />
                  </div>
                )}
                {data.labDirector === 'K. Patel' && (
                  <div className="flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/k-patel-signature.png" 
                      alt="K. Patel Signature"
                      className="h-48 w-auto object-contain"
                      style={{ 
                        maxHeight: '192px',
                        maxWidth: '480px'
                      }}
                    />
                  </div>
                )}
                <div className="text-right">
                  <div className="font-medium text-gray-900">{data.labDirector}</div>
                  <div className="text-gray-800">{data.directorTitle}</div>
                  <div className="text-gray-800">{data.approvalDate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

COATemplate.displayName = 'COATemplate';

export default memo(COATemplate); 
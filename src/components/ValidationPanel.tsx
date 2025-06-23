'use client';

import React from 'react';
import { ComprehensiveValidationResult } from '@/types';

interface ValidationPanelProps {
  validationResult: ComprehensiveValidationResult | null;
  className?: string;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validationResult,
  className = ''
}) => {
  if (!validationResult) {
    return null;
  }

  const { isValid, errors, warnings } = validationResult;

  if (isValid && warnings.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Validation Passed
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>COA validation completed successfully with no issues found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Validation Errors ({errors.length})
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>
                      <span className="font-medium">{error.field && `${error.field}: `}</span>
                      {error.message}
                      {error.expectedValue !== undefined && error.actualValue !== undefined && (
                        <span className="text-xs block text-red-600">
                          Expected: {error.expectedValue.toFixed(3)}, Got: {error.actualValue.toFixed(3)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Validation Warnings ({warnings.length})
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>
                      <span className="font-medium">{warning.field && `${warning.field}: `}</span>
                      {warning.message}
                      {warning.actualValue !== undefined && (
                        <span className="text-xs block text-yellow-600">
                          Value: {warning.actualValue.toFixed(3)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Validation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Cannabinoid Formula Check */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Formula Validation</h4>
            <div className="space-y-1 text-gray-600">
              <div>THC Calc: {validationResult.cannabinoidFormulaCheck.totalTHCCalculated.toFixed(3)}%</div>
              <div>THC Rep: {validationResult.cannabinoidFormulaCheck.totalTHCReported.toFixed(3)}%</div>
              <div>CBD Calc: {validationResult.cannabinoidFormulaCheck.totalCBDCalculated.toFixed(3)}%</div>
              <div>CBD Rep: {validationResult.cannabinoidFormulaCheck.totalCBDReported.toFixed(3)}%</div>
              <div>Sum Calc: {validationResult.cannabinoidFormulaCheck.sumOfCannabinoidsCalculated.toFixed(3)}%</div>
              <div>Sum Rep: {validationResult.cannabinoidFormulaCheck.sumOfCannabinoidsReported.toFixed(3)}%</div>
            </div>
          </div>

          {/* Logic Consistency Check */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Logic Checks</h4>
            <div className="space-y-1 text-gray-600">
              <div className="flex items-center">
                <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                  validationResult.logicConsistencyCheck.totalCannabiniodsGteTotalTHC ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                Total ≥ THC
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                  validationResult.logicConsistencyCheck.moistureInRange ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                Moisture Range
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                  !validationResult.logicConsistencyCheck.delta8THCFlagged ? 'bg-green-400' : 'bg-yellow-400'
                }`}></span>
                Delta-8 THC
              </div>
            </div>
          </div>

          {/* Data Uniqueness Check */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Uniqueness Checks</h4>
            <div className="space-y-1 text-gray-600">
              <div className="flex items-center">
                <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                  !validationResult.dataUniquenessCheck.duplicateCannabinoidsFound ? 'bg-green-400' : 'bg-yellow-400'
                }`}></span>
                Cannabinoids
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                  !validationResult.dataUniquenessCheck.duplicateMoistureFound ? 'bg-green-400' : 'bg-yellow-400'
                }`}></span>
                Moisture
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                  !validationResult.dataUniquenessCheck.duplicateBatchIdFound ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                Batch ID
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                  !validationResult.dataUniquenessCheck.duplicateSampleIdFound ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                Sample ID
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPanel; 
import { useReducer, useCallback, useMemo } from 'react';
import { COAData, CannabinoidProfile } from '@/types';
import { generateEdibleCannabinoidProfile, updateCOAWithProfile } from '@/utils';
import { getEmployeeTitle } from '@/constants/labEmployees';

// Action types for the reducer
type COAAction =
  | { type: 'SET_COA_DATA'; payload: COAData }
  | { type: 'UPDATE_CLIENT'; payload: { name: string; address: string; license: string } }
  | { type: 'UPDATE_LAB_EMPLOYEE'; payload: string }
  | { type: 'UPDATE_SAMPLE_SIZE'; payload: string }
  | { type: 'UPDATE_DATES'; payload: { collected: string; received: string; tested: string; testedEnd: string } }
  | { type: 'UPDATE_EDIBLE_DOSAGE'; payload: { dosage: number; sampleSize: string } }
  | { type: 'UPDATE_PROFILE'; payload: CannabinoidProfile };

// Reducer function - handles all COA updates in ONE place
function coaReducer(state: COAData, action: COAAction): COAData {
  switch (action.type) {
    case 'SET_COA_DATA':
      return action.payload;
    
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clientName: action.payload.name,
        clientAddress: action.payload.address,
        licenseNumber: action.payload.license
      };
    
    case 'UPDATE_LAB_EMPLOYEE':
      return {
        ...state,
        labDirector: action.payload,
        directorTitle: getEmployeeTitle(action.payload)
      };
    
    case 'UPDATE_SAMPLE_SIZE':
      return {
        ...state,
        sampleSize: action.payload
      };
    
    case 'UPDATE_DATES':
      return {
        ...state,
        dateCollected: action.payload.collected,
        dateReceived: action.payload.received,
        dateTested: action.payload.tested,
        dateTestedEnd: action.payload.testedEnd,
        approvalDate: action.payload.tested,
        dateReported: action.payload.tested
      };
    
    case 'UPDATE_EDIBLE_DOSAGE': {
      const edibleProfile = generateEdibleCannabinoidProfile(action.payload.dosage, action.payload.sampleSize);
      return {
        ...state,
        edibleDosage: action.payload.dosage,
        cannabinoids: edibleProfile.cannabinoids,
        totalTHC: edibleProfile.totalTHC,
        totalCBD: edibleProfile.totalCBD,
        totalCannabinoids: edibleProfile.totalCannabinoids
      };
    }
    
    case 'UPDATE_PROFILE':
      return updateCOAWithProfile(state, action.payload);
    
    default:
      return state;
  }
}

// Custom hook to manage COA state with reducer
export const useCOAState = (initialCOA: COAData) => {
  const [coaData, dispatch] = useReducer(coaReducer, initialCOA);
  
  // Action creators (these are safe to call - no infinite loops)
  const updateClient = useCallback((name: string, address: string, license: string) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: { name, address, license } });
  }, []);
  
  const updateLabEmployee = useCallback((employee: string) => {
    dispatch({ type: 'UPDATE_LAB_EMPLOYEE', payload: employee });
  }, []);
  
  const updateSampleSize = useCallback((size: string) => {
    dispatch({ type: 'UPDATE_SAMPLE_SIZE', payload: size });
  }, []);
  
  const updateDates = useCallback((collected: string, received: string, tested: string, testedEnd: string) => {
    dispatch({ type: 'UPDATE_DATES', payload: { collected, received, tested, testedEnd } });
  }, []);
  
  const updateEdibleDosage = useCallback((dosage: number, sampleSize: string) => {
    dispatch({ type: 'UPDATE_EDIBLE_DOSAGE', payload: { dosage, sampleSize } });
  }, []);
  
  const updateProfile = useCallback((profile: CannabinoidProfile) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: profile });
  }, []);
  
  const setCOAData = useCallback((data: COAData | ((prev: COAData) => COAData)) => {
    if (typeof data === 'function') {
      // If function provided, call it with current state
      const newData = data(coaData);
      dispatch({ type: 'SET_COA_DATA', payload: newData });
    } else {
      dispatch({ type: 'SET_COA_DATA', payload: data });
    }
  }, [coaData]);
  
  return {
    coaData,
    setCOAData,
    updateClient,
    updateLabEmployee,
    updateSampleSize,
    updateDates,
    updateEdibleDosage,
    updateProfile
  };
};


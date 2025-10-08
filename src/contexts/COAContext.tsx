'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { COAData, ProductType, CannabinoidProfile, Client } from '@/types';

interface FormState {
  strain: string;
  dateReceived: string;
  dateCollected: string;
  dateTested: string;
  dateTestedEnd: string;
  selectedProfile: CannabinoidProfile;
  selectedLabEmployee: string;
  sampleSize: string;
  productType: ProductType;
  edibleDosage: number;
  isMultiStrain: boolean;
  strainList: string;
}

interface COAContextType {
  // COA Data
  coaData: COAData;
  setCOAData: React.Dispatch<React.SetStateAction<COAData>>;
  
  // Form State
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  
  // Client
  clients: Client[];
  selectedClientId: string;
  loadingClients: boolean;
  
  // Generated COAs
  generatedCOAs: COAData[];
  currentCOAIndex: number;
  isGeneratingBatch: boolean;
  
  // Event Handlers
  handleClientChange: (clientId: string) => void;
  handleProductTypeChange: (type: ProductType) => void;
  handleProfileChange: (profile: CannabinoidProfile) => void;
  handleLabEmployeeChange: (employee: string) => void;
  handleSampleSizeChange: (size: string) => void;
  handleDateChange: (field: 'dateCollected' | 'dateReceived' | 'dateTested' | 'dateTestedEnd', value: string) => void;
  handleEdibleDosageChange: (dosage: number) => void;
  
  // Actions
  handleGenerateSingle: () => void;
  handleGenerateBatch: () => Promise<void>;
  handleUploadToSupabase: () => Promise<void>;
  handleUploadAllToSupabase: () => Promise<void>;
  handleBurnBatch: () => Promise<void>;
}

const COAContext = createContext<COAContextType | undefined>(undefined);

export const useCOAContext = () => {
  const context = useContext(COAContext);
  if (!context) {
    throw new Error('useCOAContext must be used within COAProvider');
  }
  return context;
};

interface COAProviderProps {
  children: ReactNode;
  value: COAContextType;
}

export const COAProvider: React.FC<COAProviderProps> = ({ children, value }) => {
  return <COAContext.Provider value={value}>{children}</COAContext.Provider>;
};


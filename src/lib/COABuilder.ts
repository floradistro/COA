import { COAData, ProductType, CannabinoidProfile, Client } from '@/types';
import { generateDefaultCOAData, updateCOAWithProfile } from '@/utils';
import { getEmployeeTitle } from '@/constants/labEmployees';

/**
 * COA Builder Class - Handles all COA data transformations in one place
 * Provides a clean, testable API for COA operations
 */
export class COABuilder {
  private coa: COAData;

  constructor(initialCOA?: COAData) {
    this.coa = initialCOA || generateDefaultCOAData();
  }

  // Factory methods
  static fromStrain(strain: string, dateReceived: string, productType: ProductType): COABuilder {
    return new COABuilder(generateDefaultCOAData(strain, dateReceived, productType));
  }

  static fromExisting(coa: COAData): COABuilder {
    return new COABuilder({ ...coa });
  }

  // Chainable setters
  withClient(client: Client): COABuilder {
    this.coa = {
      ...this.coa,
      clientName: client.name,
      clientAddress: client.address,
      licenseNumber: client.license_number
    };
    return this;
  }

  withLabEmployee(employeeName: string): COABuilder {
    this.coa = {
      ...this.coa,
      labDirector: employeeName,
      directorTitle: getEmployeeTitle(employeeName)
    };
    return this;
  }

  withSampleSize(size: string): COABuilder {
    this.coa = {
      ...this.coa,
      sampleSize: size
    };
    return this;
  }

  withDates(collected: string, received: string, tested: string, testedEnd?: string): COABuilder {
    this.coa = {
      ...this.coa,
      dateCollected: collected,
      dateReceived: received,
      dateTested: tested,
      dateTestedEnd: testedEnd || tested,
      approvalDate: tested,
      dateReported: tested
    };
    return this;
  }

  withProfile(profile: CannabinoidProfile): COABuilder {
    this.coa = updateCOAWithProfile(this.coa, profile);
    return this;
  }

  withQRCode(qrDataUrl: string, publicUrl: string): COABuilder {
    this.coa = {
      ...this.coa,
      qrCodeDataUrl: qrDataUrl,
      publicUrl: publicUrl
    };
    return this;
  }

  // Getters
  getCOA(): COAData {
    return { ...this.coa };
  }

  getFileName(): string {
    const clientName = this.coa.clientName || 'Uncategorized';
    const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '_');
    const strainName = this.coa.strain || this.coa.sampleName;
    const cleanStrainName = strainName.replace(/[^a-z0-9]/gi, '_');
    return `${cleanClientName}/${cleanStrainName}.pdf`;
  }

  getSampleId(): string {
    return this.coa.sampleId;
  }

  getStrainName(): string {
    return this.coa.strain || this.coa.sampleName;
  }
}


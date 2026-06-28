import { ResponseUserDto } from './user';

export type CompanyPersonType = 'physical' | 'moral';

export interface CompanyOnboardingPayload {
  activityType?: string;
  activityId?: number;
  createNewCabinet?: boolean;
  personType: CompanyPersonType;
  enterpriseName: string;
  taxIdNumber?: string;
  logoId?: number;
  address: {
    address: string;
    city: string;
    postalCode: string;
    countryId: number;
  };
  taxSettings?: {
    vatRates: number[];
    additionalTaxes: string[];
  };
  selectedTaxTemplateIds: number[];
}

export type CompanyOnboardingResponse = ResponseUserDto;

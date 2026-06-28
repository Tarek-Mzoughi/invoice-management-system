import { Activity } from './activity';
import { Address, UpdateAddressDto } from './address';
import { Country } from './country';
import { Currency } from './currency';
import { DatabaseEntity } from './response/DatabaseEntity';

export type CabinetInvoiceDisplayType = 'invoice' | 'honorary_note';
export type CabinetPersonType = 'physical' | 'moral';

export interface CabinetTaxSettings {
  vatRates?: number[];
  additionalTaxes?: string[];
}

export interface Cabinet extends DatabaseEntity {
  id?: number;
  enterpriseName?: string;
  email?: string;
  website?: string;
  isPerson?: boolean;
  phone?: string;
  phoneNumbers?: string[];
  taxIdNumber?: string;
  activityType?: string;
  personType?: CabinetPersonType;
  taxSettings?: CabinetTaxSettings;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  activity?: Activity;
  activityId?: number;
  activities?: Activity[];
  activityIds?: number[];
  currency?: Currency;
  currencyId?: number;
  country?: Country;
  countryId?: number;
  invoiceDisplayType?: CabinetInvoiceDisplayType;
  address?: Address;
  invoicingAddress?: Address;
  deliveryAddress?: Address;
  logo?: File;
  logoId?: number;
  signature?: File;
  signatureId?: number;
  stamp?: File;
  stampId?: number;
}

export interface CreateCabinetPayload {
  enterpriseName: string;
  email?: string;
  activityType?: string;
  countryId?: number;
  currencyId?: number;
  taxIdNumber?: string;
  phone?: string;
  isPerson?: boolean;
  personType?: CabinetPersonType;
  invoiceDisplayType?: CabinetInvoiceDisplayType;
}

export interface UpdateCabinetDto
  extends Omit<
    Cabinet,
    | 'activity'
    | 'currency'
    | 'address'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
  > {
  address?: UpdateAddressDto;
  invoicingAddress?: UpdateAddressDto;
  deliveryAddress?: UpdateAddressDto;
}

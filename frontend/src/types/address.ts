import { Country } from './country';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface Address extends DatabaseEntity {
  id?: number;
  address?: string;
  address2?: string;
  region?: string;
  zipcode?: string;
  country?: Country;
  countryId?: number;
}

export type AddressType = 'invoicingAddress' | 'deliveryAddress' | '';
// export interface CreateAddressDto extends Omit<Address, 'createdAt' | 'updatedAt' | 'deletedAt' | 'country' | 'id'>{}
export interface UpdateAddressDto
  extends Omit<
    Address,
    'createdAt' | 'updatedAt' | 'deletedAt' | 'country' | 'id' | 'isDeletionRestricted'
  > {}

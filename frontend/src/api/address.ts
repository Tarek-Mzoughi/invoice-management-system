import { Address, ToastValidation } from '@/types';

const factory = (): Address => {
  return {
    address: '',
    address2: '',
    region: '',
    zipcode: '',
    countryId: 227
  };
};

const validate = (address: Partial<Address>): ToastValidation => {
  if (address.address == '') return { message: 'Adresse est obligatoire' };
  if (address?.zipcode && isNaN(parseInt(address.zipcode)))
    return { message: 'Code postal doit être un nombre' };
  if (address?.zipcode && address.zipcode.length > 5)
    return { message: 'Code postal doit avoir 5 chiffres au maximum' };
  return { message: '' };
};

export const address = { factory, validate };

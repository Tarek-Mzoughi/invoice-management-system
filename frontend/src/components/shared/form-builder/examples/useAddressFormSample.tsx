import { Field, FieldVariant, NumberFieldProps, SelectFieldProps, TextFieldProps } from '../types';

export const useAddressFormSample = () => {
  const sampledAddressField: Field<TextFieldProps> = {
    id: 'address',
    label: 'Street Address',
    variant: FieldVariant.TEXT,
    required: true,
    placeholder: 'Enter your street address',
    description: 'Please enter your complete address'
  };

  const sampledAddress2Field: Field<TextFieldProps> = {
    id: 'address2',
    label: 'Complement Address',
    variant: FieldVariant.TEXT,
    placeholder: 'Enter your complement address',
    description: 'This address field is optional'
  };

  const sampledRegionField: Field<TextFieldProps> = {
    id: 'region',
    label: 'Region',
    variant: FieldVariant.TEXT,
    required: true,
    placeholder: 'Enter the region of your address',
    description: 'Please enter the region of your address'
  };

  const sampledCountryField: Field<SelectFieldProps> = {
    id: 'country',
    label: 'Country',
    variant: FieldVariant.SELECT,
    placeholder: 'Enter the country you live in',
    required: true,
    description: 'Please enter the country you live in',
    props: {
      options: []
    }
  };

  const sampledZipCodeField: Field<NumberFieldProps> = {
    id: 'zipcode',
    label: 'Zip Code',
    variant: FieldVariant.NUMBER,
    required: true,
    placeholder: 'Enter your zip code',
    description: 'Please enter your zip code'
  };

  return {
    sampledAddressField,
    sampledAddress2Field,
    sampledRegionField,
    sampledCountryField,
    sampledZipCodeField
  };
};

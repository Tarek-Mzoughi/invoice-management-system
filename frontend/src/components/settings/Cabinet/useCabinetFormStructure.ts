import {
  Field,
  FieldVariant,
  FormStructure,
  SelectFieldProps,
  TelFieldProps,
  TextFieldProps
} from '@/components/shared/form-builder/types';
import { useTranslation } from 'react-i18next';
import { Activity, Country, Currency } from '@/types';

interface UseCabinetFormStructureProps {
  cabinetManager: any;
  countries?: Country[];
  activities?: Activity[];
  currencies?: Currency[];
  isPending?: boolean;
}

export const useCabinetFormStructure = ({
  cabinetManager,
  countries = [],
  activities = [],
  currencies = [],
  isPending
}: UseCabinetFormStructureProps) => {
  const { t: tSettings } = useTranslation('settings');
  const { t: tContacts } = useTranslation('contacts');
  const { t: tCountry } = useTranslation('country');
  const { t: tCurrency } = useTranslation('currency');

  const nameField: Field<TextFieldProps> = {
    id: 'enterpriseName',
    label: `${tSettings('cabinet.attributes.name')}(*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Zedney Creative',
    props: {
      value: cabinetManager.enterpriseName || '',
      onChange: (value) => cabinetManager.set('enterpriseName', value),
      disabled: isPending
    }
  };

  const phoneField: Field<TelFieldProps> = {
    id: 'phone',
    label: tSettings('cabinet.attributes.phone'),
    variant: FieldVariant.TEL,
    placeholder: 'Ex. +216 72 398 389',
    props: {
      value: cabinetManager.phone || '',
      onChange: (value) => cabinetManager.set('phone', value),
      disabled: isPending
    }
  };

  const emailField: Field<TextFieldProps> = {
    id: 'email',
    label: tSettings('cabinet.attributes.email'),
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. contact@invoicing-system.tn',
    props: {
      value: cabinetManager.email || '',
      onChange: (value) => cabinetManager.set('email', value),
      disabled: isPending
    }
  };

  const addressField: Field<TextFieldProps> = {
    id: 'address',
    label: `${tContacts('common.address.address')}(*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. 188 Avenue 14 Janvier',
    props: {
      value: cabinetManager.address?.address || '',
      onChange: (value) =>
        cabinetManager.set('address', {
          ...cabinetManager.address,
          address: value
        }),
      disabled: isPending
    }
  };

  const cityField: Field<TextFieldProps> = {
    id: 'city',
    label: tContacts('common.address.city'),
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Nabeul',
    props: {
      value: cabinetManager.address?.city || '',
      onChange: (value) =>
        cabinetManager.set('address', {
          ...cabinetManager.address,
          city: value
        }),
      disabled: isPending
    }
  };

  const regionField: Field<TextFieldProps> = {
    id: 'region',
    label: `${tContacts('common.address.region')}(*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Bizerte',
    props: {
      value: cabinetManager.address?.region || '',
      onChange: (value) =>
        cabinetManager.set('address', {
          ...cabinetManager.address,
          region: value
        }),
      disabled: isPending
    }
  };

  const zipCodeField: Field<TextFieldProps> = {
    id: 'zipCode',
    label: `${tContacts('common.address.zip_code')}(*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. 7000',
    props: {
      value: cabinetManager.address?.zipcode || '',
      onChange: (value) =>
        cabinetManager.set('address', {
          ...cabinetManager.address,
          zipcode: value
        }),
      disabled: isPending
    }
  };

  const countryField: Field<SelectFieldProps> = {
    id: 'country',
    label: `${tContacts('common.address.country')}(*)`,
    variant: FieldVariant.SELECT,
    placeholder: 'Pays',
    props: {
      value: cabinetManager.address?.countryId?.toString(),
      onValueChange: (value) =>
        cabinetManager.set('address', {
          ...cabinetManager.address,
          countryId: value
        }),
      options: countries.map((country) => ({
        label: country?.alpha2Code ? tCountry(country.alpha2Code) : (country.alpha3Code || ''),
        value: country.id!.toString()
      })),
      disabled: isPending
    }
  };

  const taxIdField: Field<TextFieldProps> = {
    id: 'taxIdNumber',
    label: `${tSettings('cabinet.attributes.tax_number')}(*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. 1538414/L/A/M/0000',
    props: {
      value: cabinetManager.taxIdNumber || '',
      onChange: (value) => cabinetManager.set('taxIdNumber', value),
      disabled: isPending
    }
  };

  const activityField: Field<SelectFieldProps> = {
    id: 'activity',
    label: tSettings('cabinet.attributes.activity'),
    variant: FieldVariant.SELECT,
    placeholder: 'Activité',
    props: {
      value: cabinetManager.activity?.id?.toString(),
      onValueChange: (value) => cabinetManager.set('activity', { id: parseInt(value) } as Activity),
      options: activities.map((activity) => ({
        label: activity.label || '',
        value: activity.id!.toString()
      })),
      disabled: isPending
    }
  };

  const currencyField: Field<SelectFieldProps> = {
    id: 'currency',
    label: tSettings('cabinet.attributes.currency'),
    variant: FieldVariant.SELECT,
    placeholder: 'Devise Principale',
    props: {
      value: cabinetManager.currency?.id?.toString(),
      onValueChange: (value) => cabinetManager.set('currency', { id: parseInt(value) } as Currency),
      options: currencies.map((currency) => ({
        label: `${currency?.code ? tCurrency(currency?.code) : currency.label} (${currency.symbol})`,
        value: currency.id!.toString()
      })),
      disabled: isPending
    }
  };

  const cabinetFormStructure: FormStructure = {
    orientation: 'vertical',
    fieldsets: [
      {
        rows: [
          {
            fields: [nameField]
          },
          {
            fields: [phoneField, emailField]
          },
          {
            fields: [addressField]
          },
          {
            fields: [cityField]
          },
          {
            fields: [regionField, zipCodeField, countryField]
          }
        ]
      }
    ]
  };

  const accountingFormStructure: FormStructure = {
    orientation: 'vertical',
    fieldsets: [
      {
        rows: [
          {
            fields: [taxIdField, activityField, currencyField]
          }
        ]
      }
    ]
  };

  return { cabinetFormStructure, accountingFormStructure };
};

import {
  Field,
  FieldVariant,
  FormStructure,
  NumberFieldProps,
  SelectFieldProps,
  SwitchFieldProps,
  TextFieldProps
} from '@/components/shared/form-builder/types';
import { TaxManager } from './hooks/useTaxManager';
import { Currency } from '@/types';
import { useTranslation } from 'react-i18next';

interface useTaxFormStructureProps {
  store: TaxManager;
  currencies: Currency[];
}

export const useTaxFormStructure = ({ store, currencies }: useTaxFormStructureProps) => {
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { t: tCurrency } = useTranslation('currency');

  const labelField: Field<TextFieldProps> = {
    id: 'tax-label',
    label: 'Label',
    required: true,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. FODEC',
    description: 'Enter a unique name for the tax (e.g., VAT, FODEC)',
    props: {
      value: store.label,
      onChange: (e: string) => store.set('label', e)
    }
  };

  const valueField: Field<NumberFieldProps> = {
    id: 'tax-value',
    label: 'Value',
    required: true,
    variant: FieldVariant.NUMBER,
    placeholder: 'Ex. 10',
    description: 'Enter the value of the tax (e.g., 10 for 10%)',
    props: {
      value: store.value,
      onChange: (e: number) => store.set('value', e)
    }
  };

  const typeField: Field<SelectFieldProps> = {
    id: 'tax-type',
    label: 'Type',
    required: true,
    variant: FieldVariant.SELECT,
    placeholder: 'Ex. PERCENTAGE',
    description: 'Select the type of tax (e.g., percentage or amount)',
    props: {
      options: [
        {
          label: 'Percentage (%)',
          value: 'PERCENTAGE'
        },
        {
          label: 'Amount ($)',
          value: 'AMOUNT'
        }
      ],
      value: store.isRate ? 'PERCENTAGE' : 'AMOUNT',
      onValueChange: (e: string) => store.set('isRate', e === 'PERCENTAGE')
    }
  };

  const isSpecialField: Field<SwitchFieldProps> = {
    id: 'tax-is-special',
    label: 'Special Tax',
    variant: FieldVariant.SWITCH,
    description:
      'Une taxe spéciale est appliquée sur le montant après que les taxes normales ont déjà été calculées.',
    props: {
      checked: store.isSpecial,
      onCheckedChange: (e: boolean) => store.set('isSpecial', e)
    }
  };

  const specificCurrencyField: Field<SwitchFieldProps> = {
    id: 'tax-specific-currency',
    label: 'Specific Currency',
    variant: FieldVariant.SWITCH,
    description: 'Set a specific currency for this tax',
    props: {
      checked: store.specificCurrency,
      onCheckedChange: (e: boolean) => store.set('specificCurrency', e)
    }
  };

  const currencyField: Field<SelectFieldProps> = {
    id: 'tax-type',
    label: 'Currency',
    required: true,
    variant: FieldVariant.SELECT,
    placeholder: 'Ex. Tunisian Dinar',
    description: 'Choose the currency of the tax',
    hidden: !store.specificCurrency,
    props: {
      options: currencies.map((c) => ({
        label: `${c.label} (${c.symbol})`,
        value: c.id?.toString()
      })),
      value: store.currencyId?.toString(),
      onValueChange: (e: string) => store.set('currencyId', Number(e))
    }
  };

  const taxFormStructure: FormStructure = {
    title: 'Tax Form',
    orientation: 'horizontal',
    fieldsets: [
      {
        title: 'Tax',
        rows: [
          {
            fields: [labelField]
          },
          {
            fields: [valueField, typeField]
          },
          {
            fields: [isSpecialField]
          },
          {
            fields: [specificCurrencyField]
          },
          {
            fields: [currencyField]
          }
        ]
      }
    ]
  };

  return { taxFormStructure };
};

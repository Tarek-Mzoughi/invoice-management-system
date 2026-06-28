import {
  Field,
  FieldVariant,
  FormStructure,
  NumberFieldProps,
  TextFieldProps
} from '@/components/shared/form-builder/types';
import { useTaxWithholdingManager } from './hooks/useTaxWithholdingManager';
import { useTranslation } from 'react-i18next';

export const useTaxWithholdingFormStructure = () => {
  const { t: tSettings } = useTranslation('settings');
  const taxWithholdingManager = useTaxWithholdingManager();

  const labelField: Field<TextFieldProps> = {
    id: 'tax-withholding-label',
    label: tSettings('withholding.attributes.label'),
    required: true,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Régime réel',
    props: {
      value: taxWithholdingManager.label,
      onChange: (e: string) => taxWithholdingManager.set('label', e)
    }
  };

  const rateField: Field<NumberFieldProps> = {
    id: 'tax-withholding-rate',
    label: tSettings('withholding.attributes.rate'),
    required: true,
    variant: FieldVariant.NUMBER,
    placeholder: 'Ex. 10',
    props: {
      value: taxWithholdingManager.rate,
      onChange: (e: number) => taxWithholdingManager.set('rate', e)
    }
  };

  const taxWithholdingFormStructure: FormStructure = {
    title: tSettings('withholding.singular'),
    orientation: 'horizontal',
    fieldsets: [
      {
        rows: [
          {
            fields: [labelField, rateField]
          }
        ]
      }
    ]
  };

  return { taxWithholdingFormStructure };
};

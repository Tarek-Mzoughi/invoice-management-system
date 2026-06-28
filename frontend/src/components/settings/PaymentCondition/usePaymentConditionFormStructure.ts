import {
  Field,
  FieldVariant,
  FormStructure,
  TextFieldProps,
  TextareaFieldProps
} from '@/components/shared/form-builder/types';
import { usePaymentConditionManager } from './hooks/usePaymentConditionManager';
import { useTranslation } from 'react-i18next';

export const usePaymentConditionFormStructure = () => {
  const { t } = useTranslation('settings');
  const paymentConditionManager = usePaymentConditionManager();

  const labelField: Field<TextFieldProps> = {
    id: 'payment-condition-label',
    label: 'Titre(*)',
    required: true,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Envoyer des rappels',
    props: {
      value: paymentConditionManager.label,
      onChange: (e: string) => paymentConditionManager.set('label', e)
    }
  };

  const descriptionField: Field<TextareaFieldProps> = {
    id: 'payment-condition-description',
    label: 'Description(*)',
    required: true,
    variant: FieldVariant.TEXTAREA,
    placeholder: 'Ex. Envoyer des rappels',
    props: {
      value: paymentConditionManager.description,
      onChange: (e: string) => paymentConditionManager.set('description', e),
      resizable: false
    }
  };

  const paymentConditionFormStructure: FormStructure = {
    title: 'Condition de Paiement',
    orientation: 'horizontal',
    fieldsets: [
      {
        rows: [
          {
            fields: [labelField]
          },
          {
            fields: [descriptionField]
          }
        ]
      }
    ]
  };

  return { paymentConditionFormStructure };
};

import {
  DateFieldProps,
  Field,
  FieldVariant,
  FormStructure,
  SelectFieldProps,
  TextFieldProps
} from '@/components/shared/form-builder/types';
import { useTranslation } from 'react-i18next';
import { ACTIVITY_TYPE, Firm, Interlocutor } from '@/types';
interface UseQuotationGeneralFormStructureProps {
  quotationManager: any;
  firms: Firm[];
  loading?: boolean;
  edit?: boolean;
  activityType?: ACTIVITY_TYPE;
}
export const useQuotationGeneralFormStructure = ({
  quotationManager,
  firms,
  loading,
  edit = true,
  activityType = ACTIVITY_TYPE.SELLING
}: UseQuotationGeneralFormStructureProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const firmLabel = tInvoicing('quotation.attributes.customer');
  const firmPlaceholder = tInvoicing('quotation.associate_customer');
  const dateField: Field<DateFieldProps> = {
    id: 'date',
    label: `${tInvoicing('quotation.attributes.date')} (*)`,
    variant: FieldVariant.DATE,
    placeholder: tInvoicing('quotation.attributes.date'),
    props: {
      value: quotationManager?.date || new Date(),
      onDateChange: (value) => quotationManager.set('date', value),
      disabled: !edit || loading
    }
  };
  const dueDateField: Field<DateFieldProps> = {
    id: 'dueDate',
    label: `${tInvoicing('quotation.attributes.due_date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: quotationManager?.dueDate || undefined,
      onDateChange: (value) => quotationManager.set('dueDate', value),
      disabled: !edit || loading
    }
  };
  const objectField: Field<TextFieldProps> = {
    id: 'object',
    label: `${tInvoicing('quotation.attributes.object')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: tInvoicing('quotation.placeholders.object'),
    props: {
      value: quotationManager.object || '',
      onChange: (value) => quotationManager.set('object', value),
      disabled: !edit || loading
    }
  };
  const firmField: Field<SelectFieldProps> = {
    id: 'firm',
    label: `${firmLabel} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: firmPlaceholder,
    props: {
      value: quotationManager.firm?.id?.toString(),
      onValueChange: (value) => {
        const firm = firms?.find((firm) => firm.id === parseInt(value));
        quotationManager.setFirm(firm);
        quotationManager.set('currency', firm?.currency);
      },
      options:
        firms?.map((firm) => ({
          label: firm.name || '',
          value: firm.id?.toString() || ''
        })) || [],
      disabled: !edit || loading
    }
  };
  const interlocutorField: Field<SelectFieldProps> = {
    id: 'interlocutor',
    label: `${tInvoicing('quotation.attributes.interlocutor')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: tInvoicing('quotation.associate_interlocutor'),
    props: {
      value: quotationManager.interlocutor?.id?.toString(),
      onValueChange: (value) =>
        quotationManager.setInterlocutor({ id: parseInt(value) } as Interlocutor),
      options:
        quotationManager.firm?.interlocutorsToFirm?.map((entry: any) => ({
          label: `${entry.interlocutor?.name} ${entry.interlocutor?.surname} ${entry.isMain ? `(${tCommon('words.main_m')})` : ''}`,
          value: entry.interlocutor?.id?.toString() || ''
        })) || [],
      disabled: !edit || !quotationManager?.firm?.id || loading
    }
  };
  const quotationGeneralFormStructure: FormStructure = {
    orientation: 'horizontal',
    fieldsets: [
      {
        rows: [
          {
            fields: [dateField, dueDateField]
          },
          {
            fields: [objectField]
          },
          {
            fields: [firmField, interlocutorField]
          }
        ]
      }
    ]
  };
  return { quotationGeneralFormStructure };
};

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
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
interface UseCustomerOrderGeneralFormStructureProps {
  customerOrderManager: any;
  firms: Firm[];
  loading?: boolean;
  edit?: boolean;
  activityType?: ACTIVITY_TYPE;
}
export const useCustomerOrderGeneralFormStructure = ({
  customerOrderManager,
  firms,
  loading,
  edit = true,
  activityType = ACTIVITY_TYPE.SELLING
}: UseCustomerOrderGeneralFormStructureProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const documentLabels = useScopedDocumentLabels('customerOrder', 'buying');
  const firmLabel = tInvoicing('customerOrder.attributes.supplier');
  const firmPlaceholder = tInvoicing('customerOrder.associate_supplier');
  const dateField: Field<DateFieldProps> = {
    id: 'date',
    label: `${tInvoicing('customerOrder.attributes.date')} (*)`,
    variant: FieldVariant.DATE,
    placeholder: tInvoicing('customerOrder.attributes.date'),
    props: {
      value: customerOrderManager?.date || new Date(),
      onDateChange: (value) => customerOrderManager.set('date', value),
      disabled: !edit || loading
    }
  };
  const dueDateField: Field<DateFieldProps> = {
    id: 'dueDate',
    label: `${tInvoicing('customerOrder.attributes.due_date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: customerOrderManager?.dueDate || undefined,
      onDateChange: (value) => customerOrderManager.set('dueDate', value),
      disabled: !edit || loading
    }
  };
  const objectField: Field<TextFieldProps> = {
    id: 'object',
    label: `${tInvoicing('customerOrder.attributes.object')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: tInvoicing('customerOrder.placeholders.object'),
    props: {
      value: customerOrderManager.object || '',
      onChange: (value) => customerOrderManager.set('object', value),
      disabled: !edit || loading
    }
  };
  const referenceField: Field<TextFieldProps> | null = {
    id: 'reference',
    label: `${documentLabels.referenceFieldLabel} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: documentLabels.referencePlaceholder,
    props: {
      value: customerOrderManager.reference || '',
      onChange: (value) => customerOrderManager.set('reference', value),
      disabled: !edit || loading
    }
  };
  const firmField: Field<SelectFieldProps> = {
    id: 'firm',
    label: `${firmLabel} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: firmPlaceholder,
    props: {
      value: customerOrderManager.firm?.id?.toString(),
      onValueChange: (value) => {
        const firm = firms?.find((firm) => firm.id === parseInt(value));
        customerOrderManager.setFirm(firm);
        customerOrderManager.set('currency', firm?.currency);
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
    label: `${tInvoicing('customerOrder.attributes.interlocutor')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: tInvoicing('customerOrder.associate_interlocutor'),
    props: {
      value: customerOrderManager.interlocutor?.id?.toString(),
      onValueChange: (value) =>
        customerOrderManager.setInterlocutor({ id: parseInt(value) } as Interlocutor),
      options:
        customerOrderManager.firm?.interlocutorsToFirm?.map((entry: any) => ({
          label: `${entry.interlocutor?.name} ${entry.interlocutor?.surname} ${entry.isMain ? `(${tCommon('words.main_m')})` : ''}`,
          value: entry.interlocutor?.id?.toString() || ''
        })) || [],
      disabled: !edit || !customerOrderManager?.firm?.id || loading
    }
  };
  const customerOrderGeneralFormStructure: FormStructure = {
    orientation: 'horizontal',
    fieldsets: [
      {
        rows: [
          {
            fields: [dateField, dueDateField]
          },
          {
            fields: referenceField ? [objectField, referenceField] : [objectField]
          },
          {
            fields: [firmField, interlocutorField]
          }
        ]
      }
    ]
  };
  return { customerOrderGeneralFormStructure };
};

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
interface UseDeliveryNoteGeneralFormStructureProps {
  deliveryNoteManager: any;
  firms: Firm[];
  loading?: boolean;
  edit?: boolean;
  activityType?: ACTIVITY_TYPE;
}
export const useDeliveryNoteGeneralFormStructure = ({
  deliveryNoteManager,
  firms,
  loading,
  edit = true,
  activityType = ACTIVITY_TYPE.SELLING
}: UseDeliveryNoteGeneralFormStructureProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const documentLabels = useScopedDocumentLabels('deliveryNote', 'buying');
  const firmLabel = tInvoicing('deliveryNote.attributes.supplier');
  const firmPlaceholder = tInvoicing('deliveryNote.associate_supplier');
  const dateField: Field<DateFieldProps> = {
    id: 'date',
    label: `${tInvoicing('deliveryNote.attributes.date')} (*)`,
    variant: FieldVariant.DATE,
    placeholder: tInvoicing('deliveryNote.attributes.date'),
    props: {
      value: deliveryNoteManager?.date || new Date(),
      onDateChange: (value) => deliveryNoteManager.set('date', value),
      disabled: !edit || loading
    }
  };
  const dueDateField: Field<DateFieldProps> = {
    id: 'dueDate',
    label: `${tInvoicing('deliveryNote.attributes.due_date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: deliveryNoteManager?.dueDate || undefined,
      onDateChange: (value) => deliveryNoteManager.set('dueDate', value),
      disabled: !edit || loading
    }
  };
  const objectField: Field<TextFieldProps> = {
    id: 'object',
    label: `${tInvoicing('deliveryNote.attributes.object')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: tInvoicing('deliveryNote.placeholders.object'),
    props: {
      value: deliveryNoteManager.object || '',
      onChange: (value) => deliveryNoteManager.set('object', value),
      disabled: !edit || loading
    }
  };
  const referenceField: Field<TextFieldProps> | null = {
    id: 'reference',
    label: `${documentLabels.referenceFieldLabel} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: documentLabels.referencePlaceholder,
    props: {
      value: deliveryNoteManager.reference || '',
      onChange: (value) => deliveryNoteManager.set('reference', value),
      disabled: !edit || loading
    }
  };
  const firmField: Field<SelectFieldProps> = {
    id: 'firm',
    label: `${firmLabel} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: firmPlaceholder,
    props: {
      value: deliveryNoteManager.firm?.id?.toString(),
      onValueChange: (value) => {
        const firm = firms?.find((firm) => firm.id === parseInt(value));
        deliveryNoteManager.setFirm(firm);
        deliveryNoteManager.set('currency', firm?.currency);
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
    label: `${tInvoicing('deliveryNote.attributes.interlocutor')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: tInvoicing('deliveryNote.associate_interlocutor'),
    props: {
      value: deliveryNoteManager.interlocutor?.id?.toString(),
      onValueChange: (value) =>
        deliveryNoteManager.setInterlocutor({ id: parseInt(value) } as Interlocutor),
      options:
        deliveryNoteManager.firm?.interlocutorsToFirm?.map((entry: any) => ({
          label: `${entry.interlocutor?.name} ${entry.interlocutor?.surname} ${entry.isMain ? `(${tCommon('words.main_m')})` : ''}`,
          value: entry.interlocutor?.id?.toString() || ''
        })) || [],
      disabled: !edit || !deliveryNoteManager?.firm?.id || loading
    }
  };
  const deliveryNoteGeneralFormStructure: FormStructure = {
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
  return { deliveryNoteGeneralFormStructure };
};

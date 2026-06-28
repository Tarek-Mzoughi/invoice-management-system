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
interface UseReturnNoteGeneralFormStructureProps {
  returnNoteManager: any;
  firms: Firm[];
  loading?: boolean;
  edit?: boolean;
  activityType?: ACTIVITY_TYPE;
}
export const useReturnNoteGeneralFormStructure = ({
  returnNoteManager,
  firms,
  loading,
  edit = true,
  activityType = ACTIVITY_TYPE.SELLING
}: UseReturnNoteGeneralFormStructureProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const documentLabels = useScopedDocumentLabels('returnNote', 'buying');
  const firmLabel = tInvoicing('returnNote.attributes.supplier');
  const firmPlaceholder = tInvoicing('returnNote.associate_supplier');
  const dateField: Field<DateFieldProps> = {
    id: 'date',
    label: `${tInvoicing('returnNote.attributes.date')} (*)`,
    variant: FieldVariant.DATE,
    placeholder: tInvoicing('returnNote.attributes.date'),
    props: {
      value: returnNoteManager?.date || new Date(),
      onDateChange: (value) => returnNoteManager.set('date', value),
      disabled: !edit || loading
    }
  };
  const dueDateField: Field<DateFieldProps> = {
    id: 'dueDate',
    label: `${tInvoicing('returnNote.attributes.due_date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: returnNoteManager?.dueDate || undefined,
      onDateChange: (value) => returnNoteManager.set('dueDate', value),
      disabled: !edit || loading
    }
  };
  const objectField: Field<TextFieldProps> = {
    id: 'object',
    label: `${tInvoicing('returnNote.attributes.object')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: tInvoicing('returnNote.placeholders.object'),
    props: {
      value: returnNoteManager.object || '',
      onChange: (value) => returnNoteManager.set('object', value),
      disabled: !edit || loading
    }
  };
  const referenceField: Field<TextFieldProps> | null = {
    id: 'reference',
    label: `${documentLabels.referenceFieldLabel} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: documentLabels.referencePlaceholder,
    props: {
      value: returnNoteManager.reference || '',
      onChange: (value) => returnNoteManager.set('reference', value),
      disabled: !edit || loading
    }
  };
  const firmField: Field<SelectFieldProps> = {
    id: 'firm',
    label: `${firmLabel} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: firmPlaceholder,
    props: {
      value: returnNoteManager.firm?.id?.toString(),
      onValueChange: (value) => {
        const firm = firms?.find((firm) => firm.id === parseInt(value));
        returnNoteManager.setFirm(firm);
        returnNoteManager.set('currency', firm?.currency);
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
    label: `${tInvoicing('returnNote.attributes.interlocutor')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: tInvoicing('returnNote.associate_interlocutor'),
    props: {
      value: returnNoteManager.interlocutor?.id?.toString(),
      onValueChange: (value) =>
        returnNoteManager.setInterlocutor({ id: parseInt(value) } as Interlocutor),
      options:
        returnNoteManager.firm?.interlocutorsToFirm?.map((entry: any) => ({
          label: `${entry.interlocutor?.name} ${entry.interlocutor?.surname} ${entry.isMain ? `(${tCommon('words.main_m')})` : ''}`,
          value: entry.interlocutor?.id?.toString() || ''
        })) || [],
      disabled: !edit || !returnNoteManager?.firm?.id || loading
    }
  };
  const returnNoteGeneralFormStructure: FormStructure = {
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
  return { returnNoteGeneralFormStructure };
};

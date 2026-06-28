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
interface UseGoodsIssueNoteGeneralFormStructureProps {
  goodsIssueNoteManager: any;
  firms: Firm[];
  loading?: boolean;
  edit?: boolean;
  activityType?: ACTIVITY_TYPE;
}
export const useGoodsIssueNoteGeneralFormStructure = ({
  goodsIssueNoteManager,
  firms,
  loading,
  edit = true,
  activityType = ACTIVITY_TYPE.SELLING
}: UseGoodsIssueNoteGeneralFormStructureProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const firmLabel = tInvoicing('goodsIssueNote.attributes.customer');
  const firmPlaceholder = tInvoicing('goodsIssueNote.associate_customer');
  const dateField: Field<DateFieldProps> = {
    id: 'date',
    label: `${tInvoicing('goodsIssueNote.attributes.date')} (*)`,
    variant: FieldVariant.DATE,
    placeholder: tInvoicing('goodsIssueNote.attributes.date'),
    props: {
      value: goodsIssueNoteManager?.date || new Date(),
      onDateChange: (value) => goodsIssueNoteManager.set('date', value),
      disabled: !edit || loading
    }
  };
  const dueDateField: Field<DateFieldProps> = {
    id: 'dueDate',
    label: `${tInvoicing('goodsIssueNote.attributes.due_date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: goodsIssueNoteManager?.dueDate || undefined,
      onDateChange: (value) => goodsIssueNoteManager.set('dueDate', value),
      disabled: !edit || loading
    }
  };
  const objectField: Field<TextFieldProps> = {
    id: 'object',
    label: `${tInvoicing('goodsIssueNote.attributes.object')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: tInvoicing('goodsIssueNote.placeholders.object'),
    props: {
      value: goodsIssueNoteManager.object || '',
      onChange: (value) => goodsIssueNoteManager.set('object', value),
      disabled: !edit || loading
    }
  };
  const firmField: Field<SelectFieldProps> = {
    id: 'firm',
    label: `${firmLabel} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: firmPlaceholder,
    props: {
      value: goodsIssueNoteManager.firm?.id?.toString(),
      onValueChange: (value) => {
        const firm = firms?.find((firm) => firm.id === parseInt(value));
        goodsIssueNoteManager.setFirm(firm);
        goodsIssueNoteManager.set('currency', firm?.currency);
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
    label: `${tInvoicing('goodsIssueNote.attributes.interlocutor')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: tInvoicing('goodsIssueNote.associate_interlocutor'),
    props: {
      value: goodsIssueNoteManager.interlocutor?.id?.toString(),
      onValueChange: (value) =>
        goodsIssueNoteManager.setInterlocutor({ id: parseInt(value) } as Interlocutor),
      options:
        goodsIssueNoteManager.firm?.interlocutorsToFirm?.map((entry: any) => ({
          label: `${entry.interlocutor?.name} ${entry.interlocutor?.surname} ${entry.isMain ? `(${tCommon('words.main_m')})` : ''}`,
          value: entry.interlocutor?.id?.toString() || ''
        })) || [],
      disabled: !edit || !goodsIssueNoteManager?.firm?.id || loading
    }
  };
  const goodsIssueNoteGeneralFormStructure: FormStructure = {
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
  return { goodsIssueNoteGeneralFormStructure };
};

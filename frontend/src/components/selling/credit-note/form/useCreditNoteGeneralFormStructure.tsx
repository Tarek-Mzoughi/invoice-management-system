import {
  Field,
  FieldVariant,
  FormStructure,
  TextFieldProps,
  DateFieldProps,
  SelectFieldProps,
  CustomFieldProps
} from '@/components/shared/form-builder/types';
import { useTranslation } from 'react-i18next';
import { Firm, Interlocutor } from '@/types';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import React from 'react';
import { SequenceInput } from '@/components/invoicing-commons/SequenceInput';
import { AddressDetails } from '../../../invoicing-commons/AddressDetails';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
interface UseCreditNoteGeneralFormStructureProps {
  creditNoteManager: any;
  firms: Firm[];
  isInvoicingAddressHidden?: boolean;
  isDeliveryAddressHidden?: boolean;
  loading?: boolean;
  edit?: boolean;
  activityType?: ACTIVITY_TYPE;
  onNewFirmClick: () => void;
  tCommon: any;
}
export const useCreditNoteGeneralFormStructure = ({
  creditNoteManager,
  firms = [],
  isInvoicingAddressHidden,
  isDeliveryAddressHidden,
  loading,
  edit = true,
  activityType = ACTIVITY_TYPE.SELLING,
  onNewFirmClick,
  tCommon
}: UseCreditNoteGeneralFormStructureProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const documentLabels = useScopedDocumentLabels('creditNote', 'selling');
  const firmLabel = tInvoicing('creditNote.attributes.customer');
  const firmPlaceholder = tInvoicing('creditNote.associate_customer');
  const dateField: Field<DateFieldProps> = {
    id: 'date',
    label: `${tInvoicing('creditNote.attributes.date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: creditNoteManager?.date || new Date(),
      onDateChange: (value) => creditNoteManager.set('date', value),
      disabled: !edit || loading
    }
  };
  const dueDateField: Field<DateFieldProps> = {
    id: 'dueDate',
    label: `${tInvoicing('creditNote.attributes.due_date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: creditNoteManager?.dueDate || undefined,
      onDateChange: (value) => creditNoteManager.set('dueDate', value),
      disabled: !edit || loading
    }
  };
  const objectField: Field<TextFieldProps> = {
    id: 'object',
    label: `${tInvoicing('creditNote.attributes.object')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: tInvoicing('creditNote.placeholders.object'),
    props: {
      value: creditNoteManager.object || '',
      onChange: (value) => creditNoteManager.set('object', value),
      disabled: !edit
    }
  };
  const referenceField: Field<TextFieldProps | CustomFieldProps> = {
    id: 'sequence',
    label: `${documentLabels.singular} N°`,
    variant: FieldVariant.CUSTOM,
    props: {
      children: (
        <SequenceInput
          prefix={creditNoteManager.sequentialNumber?.prefix}
          dateFormat={creditNoteManager.sequentialNumber?.dateFormat}
          value={creditNoteManager.sequentialNumber?.next}
        />
      )
    }
  };
  const firmField: Field<SelectFieldProps | CustomFieldProps> = edit
    ? {
        id: 'firm',
        label: `${firmLabel} (*)`,
        variant: FieldVariant.SELECT,
        placeholder: firmPlaceholder,
        description: (
          <span className="underline cursor-pointer" onClick={onNewFirmClick}>
            {tInvoicing('common.firm_not_there')}
          </span>
        ) as any,
        props: {
          value: creditNoteManager.firm?.id?.toString(),
          onValueChange: (value) => {
            const firm = firms?.find((f) => f.id === parseInt(value));
            creditNoteManager.setFirm(firm);
            creditNoteManager.set('currency', firm?.currency);
          },
          options: firms.map((firm) => ({
            label: firm.name || '',
            value: firm.id?.toString() || ''
          })),
          disabled: loading
        }
      }
    : {
        id: 'firm-readonly',
        label: `${firmLabel} (*)`,
        variant: FieldVariant.CUSTOM,
        props: {
          children: (
            <div className="p-2 border rounded-md bg-muted">{creditNoteManager?.firm?.name}</div>
          )
        }
      };
  const interlocutorField: Field<SelectFieldProps> = {
    id: 'interlocutor',
    label: `${tInvoicing('creditNote.attributes.interlocutor')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: tInvoicing('creditNote.associate_interlocutor'),
    props: {
      value: creditNoteManager.interlocutor?.id?.toString(),
      onValueChange: (value) => {
        creditNoteManager.setInterlocutor({ id: parseInt(value) } as Interlocutor);
      },
      options:
        creditNoteManager.firm?.interlocutorsToFirm?.map((entry: any) => ({
          label: `${entry.interlocutor?.name} ${entry.interlocutor?.surname} ${entry.isMain ? `(${tCommon('words.main_m')})` : ''}`,
          value: entry.interlocutor?.id?.toString() || ''
        })) || [],
      disabled: !edit || !creditNoteManager?.firm?.id || loading
    }
  };
  const addressField: Field<CustomFieldProps> = {
    id: 'addresses',
    variant: FieldVariant.CUSTOM,
    hidden:
      (isInvoicingAddressHidden && isDeliveryAddressHidden) ||
      creditNoteManager.firm?.id === undefined,
    props: {
      children: (
        <div className="flex gap-4 w-full mt-2">
          {!isInvoicingAddressHidden && (
            <div className="w-1/2">
              <AddressDetails
                addressType={tInvoicing('creditNote.attributes.invoicing_address')}
                address={creditNoteManager.firm?.invoicingAddress}
                loading={loading}
              />
            </div>
          )}
          {!isDeliveryAddressHidden && (
            <div className="w-1/2">
              <AddressDetails
                addressType={tInvoicing('creditNote.attributes.delivery_address')}
                address={creditNoteManager.firm?.deliveryAddress}
                loading={loading}
              />
            </div>
          )}
        </div>
      )
    }
  };
  const creditNoteGeneralFormStructure: FormStructure = {
    orientation: 'horizontal',
    fieldsets: [
      {
        rows: [
          {
            fields: [dateField, dueDateField]
          },
          {
            fields: [objectField, referenceField]
          },
          {
            fields: [firmField, interlocutorField]
          },
          {
            fields: [addressField]
          }
        ]
      }
    ]
  };
  return { creditNoteGeneralFormStructure };
};

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
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
interface UseInvoiceGeneralFormStructureProps {
  invoiceManager: any;
  firms: Firm[];
  isInvoicingAddressHidden?: boolean;
  isDeliveryAddressHidden?: boolean;
  loading?: boolean;
  edit?: boolean;
  activityType?: ACTIVITY_TYPE;
  onNewFirmClick: () => void;
  tCommon: any;
}
export const useInvoiceGeneralFormStructure = ({
  invoiceManager,
  firms = [],
  isInvoicingAddressHidden,
  isDeliveryAddressHidden,
  loading,
  edit = true,
  activityType = ACTIVITY_TYPE.SELLING,
  onNewFirmClick,
  tCommon
}: UseInvoiceGeneralFormStructureProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const invoiceLabels = useSellingInvoiceLabels({
    enabled: activityType === ACTIVITY_TYPE.SELLING
  });
  const tInvoice = invoiceLabels.t;
  const firmLabel = tInvoice('attributes.customer');
  const firmPlaceholder = tInvoice('associate_customer');
  const dateField: Field<DateFieldProps> = {
    id: 'date',
    label: `${tInvoice('attributes.date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: invoiceManager?.date || new Date(),
      onDateChange: (value) => invoiceManager.set('date', value),
      disabled: !edit || loading
    }
  };
  const dueDateField: Field<DateFieldProps> = {
    id: 'dueDate',
    label: `${tInvoice('attributes.due_date')} (*)`,
    variant: FieldVariant.DATE,
    props: {
      value: invoiceManager?.dueDate || undefined,
      onDateChange: (value) => invoiceManager.set('dueDate', value),
      disabled: !edit || loading
    }
  };
  const objectField: Field<TextFieldProps> = {
    id: 'object',
    label: `${tInvoice('attributes.object')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: tInvoice('placeholders.object'),
    props: {
      value: invoiceManager.object || '',
      onChange: (value) => invoiceManager.set('object', value),
      disabled: !edit
    }
  };
  const referenceField: Field<TextFieldProps | CustomFieldProps> = {
    id: 'sequence',
    label: `${invoiceLabels.singular} N°`,
    variant: FieldVariant.CUSTOM,
    props: {
      children: (
        <SequenceInput
          prefix={invoiceManager.sequentialNumber?.prefix}
          dateFormat={invoiceManager.sequentialNumber?.dateFormat}
          value={invoiceManager.sequentialNumber?.next}
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
          value: invoiceManager.firm?.id?.toString(),
          onValueChange: (value) => {
            const firm = firms?.find((f) => f.id === parseInt(value));
            invoiceManager.setFirm(firm);
            invoiceManager.set('currency', firm?.currency);
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
            <div className="p-2 border rounded-md bg-muted">{invoiceManager?.firm?.name}</div>
          )
        }
      };
  const interlocutorField: Field<SelectFieldProps> = {
    id: 'interlocutor',
    label: `${tInvoice('attributes.interlocutor')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: tInvoice('associate_interlocutor'),
    props: {
      value: invoiceManager.interlocutor?.id?.toString(),
      onValueChange: (value) => {
        invoiceManager.setInterlocutor({ id: parseInt(value) } as Interlocutor);
      },
      options:
        invoiceManager.firm?.interlocutorsToFirm?.map((entry: any) => ({
          label: `${entry.interlocutor?.name} ${entry.interlocutor?.surname} ${entry.isMain ? `(${tCommon('words.main_m')})` : ''}`,
          value: entry.interlocutor?.id?.toString() || ''
        })) || [],
      disabled: !edit || !invoiceManager?.firm?.id || loading
    }
  };
  const addressField: Field<CustomFieldProps> = {
    id: 'addresses',
    variant: FieldVariant.CUSTOM,
    hidden:
      (isInvoicingAddressHidden && isDeliveryAddressHidden) ||
      invoiceManager.firm?.id === undefined,
    props: {
      children: (
        <div className="flex gap-4 w-full mt-2">
          {!isInvoicingAddressHidden && (
            <div className="w-1/2">
              <AddressDetails
                addressType={tInvoice('attributes.invoicing_address')}
                address={invoiceManager.firm?.invoicingAddress}
                loading={loading}
              />
            </div>
          )}
          {!isDeliveryAddressHidden && (
            <div className="w-1/2">
              <AddressDetails
                addressType={tInvoice('attributes.delivery_address')}
                address={invoiceManager.firm?.deliveryAddress}
                loading={loading}
              />
            </div>
          )}
        </div>
      )
    }
  };
  const invoiceGeneralFormStructure: FormStructure = {
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
  return { invoiceGeneralFormStructure };
};

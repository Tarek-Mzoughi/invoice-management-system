import { Firm } from '@/types';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import React from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useInvoiceManager } from '../hooks/useInvoiceManager';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';
import { useInvoiceGeneralFormStructure } from './useInvoiceGeneralFormStructure';
interface InvoiceGeneralInformationProps {
  className?: string;
  firms: Firm[];
  isInvoicingAddressHidden?: boolean;
  isDeliveryAddressHidden?: boolean;
  edit?: boolean;
  loading?: boolean;
  activityType?: ACTIVITY_TYPE;
}
export const InvoiceGeneralInformation = ({
  className,
  firms,
  isInvoicingAddressHidden,
  isDeliveryAddressHidden,
  edit = true,
  loading,
  activityType = ACTIVITY_TYPE.SELLING
}: InvoiceGeneralInformationProps) => {
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const invoiceManager = useInvoiceManager();
  const { invoiceGeneralFormStructure } = useInvoiceGeneralFormStructure({
    invoiceManager,
    firms,
    isInvoicingAddressHidden,
    isDeliveryAddressHidden,
    loading,
    edit,
    activityType,
    onNewFirmClick: () => router.push(`/contacts/new-firm?entity=${'clients'}`),
    tCommon
  });
  return (
    <div className={cn(className)}>
      <FormBuilder structure={invoiceGeneralFormStructure} />
    </div>
  );
};

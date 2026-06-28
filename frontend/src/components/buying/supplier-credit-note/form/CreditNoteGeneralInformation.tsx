import { Firm } from '@/types';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import React from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useCreditNoteManager } from '../hooks/useCreditNoteManager';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';
import { useCreditNoteGeneralFormStructure } from './useCreditNoteGeneralFormStructure';
interface CreditNoteGeneralInformationProps {
  className?: string;
  firms: Firm[];
  isInvoicingAddressHidden?: boolean;
  isDeliveryAddressHidden?: boolean;
  edit?: boolean;
  loading?: boolean;
  activityType?: ACTIVITY_TYPE;
}
export const CreditNoteGeneralInformation = ({
  className,
  firms,
  isInvoicingAddressHidden,
  isDeliveryAddressHidden,
  edit = true,
  loading,
  activityType = ACTIVITY_TYPE.SELLING
}: CreditNoteGeneralInformationProps) => {
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const creditNoteManager = useCreditNoteManager();
  const { creditNoteGeneralFormStructure } = useCreditNoteGeneralFormStructure({
    creditNoteManager,
    firms,
    isInvoicingAddressHidden,
    isDeliveryAddressHidden,
    loading,
    edit,
    activityType,
    onNewFirmClick: () => router.push(`/contacts/new-firm?entity=${'suppliers'}`),
    tCommon
  });
  return (
    <div className={cn(className)}>
      <FormBuilder structure={creditNoteGeneralFormStructure} />
    </div>
  );
};

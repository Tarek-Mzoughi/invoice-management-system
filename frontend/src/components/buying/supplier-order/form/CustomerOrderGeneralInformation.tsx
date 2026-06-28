import { ACTIVITY_TYPE, Firm } from '@/types';
import { Label } from '@/components/ui/label';
import React from 'react';
import { AddressDetails } from '../../../invoicing-commons/AddressDetails';
import { cn } from '@/lib/utils';
import { useCustomerOrderManager } from '@/components/buying/supplier-order/hooks/useCustomerOrderManager';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useCustomerOrderGeneralFormStructure } from './useCustomerOrderGeneralFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';
interface CustomerOrderGeneralInformationProps {
  className?: string;
  firms: Firm[];
  isInvoicingAddressHidden?: boolean;
  isDeliveryAddressHidden?: boolean;
  loading?: boolean;
  edit?: boolean;
}
export const CustomerOrderGeneralInformation = ({
  className,
  firms,
  isInvoicingAddressHidden,
  isDeliveryAddressHidden,
  edit = true,
  loading
}: CustomerOrderGeneralInformationProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const router = useRouter();
  const customerOrderManager = useCustomerOrderManager();
  const entityQuery = '?entity=suppliers';
  const { customerOrderGeneralFormStructure } = useCustomerOrderGeneralFormStructure({
    customerOrderManager,
    firms,
    loading,
    edit,
    activityType: customerOrderManager?.activityType
  });
  return (
    <div className={cn(className)}>
      <FormBuilder structure={customerOrderGeneralFormStructure} />

      {/* Shortcut to access firm form */}
      {edit && (
        <div className="mt-3 mb-1 flex justify-end">
          <Label
            className="mx-1 underline cursor-pointer text-sm text-muted-foreground"
            onClick={() => router.push(`/contacts/new-firm${entityQuery}`)}
          >
            {tInvoicing('common.firm_not_there')}
          </Label>
        </div>
      )}

      {!(
        (isInvoicingAddressHidden && isDeliveryAddressHidden) ||
        customerOrderManager.firm?.id == undefined
      ) && (
        <div className="mt-5 grid gap-4 border-t border-zinc-200 pb-1 pt-5 dark:border-zinc-800 md:grid-cols-2">
          {!isInvoicingAddressHidden && (
            <div className="min-w-0">
              <AddressDetails
                addressType={tInvoicing('customerOrder.attributes.invoicing_address')}
                address={customerOrderManager.firm?.invoicingAddress}
                loading={loading}
              />
            </div>
          )}
          {!isDeliveryAddressHidden && (
            <div className="min-w-0">
              <AddressDetails
                addressType={tInvoicing('customerOrder.attributes.delivery_address')}
                address={customerOrderManager.firm?.deliveryAddress}
                loading={loading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

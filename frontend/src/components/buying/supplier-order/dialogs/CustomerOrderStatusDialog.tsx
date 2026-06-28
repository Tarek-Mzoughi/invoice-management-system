import React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericStatusDialog } from '@/features/invoicing/shared/dialogs';
import { CUSTOMER_ORDER_STATUS, CustomerOrder } from '@/types';
import type { StatusOption } from '@/features/invoicing/shared/dialogs';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
const STATUS_OPTIONS: StatusOption[] = [
  { value: CUSTOMER_ORDER_STATUS.Draft, labelKey: 'customerOrder.status.draft' },
  { value: CUSTOMER_ORDER_STATUS.Created, labelKey: 'customerOrder.status.created' },
  { value: CUSTOMER_ORDER_STATUS.Validated, labelKey: 'customerOrder.status.validated' },
  { value: CUSTOMER_ORDER_STATUS.Cancelled, labelKey: 'customerOrder.status.cancelled' }
];
const getStatusBadgeClassName = (status?: string) => {
  switch (status) {
    case CUSTOMER_ORDER_STATUS.Validated:
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case CUSTOMER_ORDER_STATUS.Created:
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case CUSTOMER_ORDER_STATUS.Draft:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    case CUSTOMER_ORDER_STATUS.Cancelled:
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  }
};
interface CustomerOrderStatusDialogProps {
  className?: string;
  customerOrder: Partial<CustomerOrder> | null;
  open: boolean;
  callback: (status: CUSTOMER_ORDER_STATUS) => void;
  isPending?: boolean;
  scope?: 'selling' | 'buying';
  onClose: () => void;
}
export const CustomerOrderStatusDialog: React.FC<CustomerOrderStatusDialogProps> = ({
  className,
  customerOrder,
  open,
  callback,
  isPending,
  scope = 'buying',
  onClose
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const documentLabels = useScopedDocumentLabels('customerOrder', scope);
  return (
    <GenericStatusDialog
      className={className}
      sequential={documentLabels.displayNumber(customerOrder)}
      currentStatus={customerOrder?.status}
      open={open}
      onConfirm={(status) => callback(status as CUSTOMER_ORDER_STATUS)}
      isPending={isPending}
      onClose={onClose}
      title={documentLabels.changeStatusTitle}
      documentLabel={documentLabels.document}
      statuses={STATUS_OPTIONS}
      getStatusBadgeClassName={getStatusBadgeClassName}
      translateStatus={(s) => tInvoicing(s)}
    />
  );
};

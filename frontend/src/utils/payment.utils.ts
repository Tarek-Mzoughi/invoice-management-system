import { PAYMENT_COLLECTION_STATUS } from '@/types';

export const getPaymentStatusTranslationKey = (status?: PAYMENT_COLLECTION_STATUS) => {
  switch (status) {
    case PAYMENT_COLLECTION_STATUS.Deposited:
      return 'treasury_checks_and_drafts.statuses.deposited';
    case PAYMENT_COLLECTION_STATUS.Paid:
      return 'treasury_checks_and_drafts.statuses.paid';
    case PAYMENT_COLLECTION_STATUS.Rejected:
      return 'treasury_checks_and_drafts.statuses.rejected';
    case PAYMENT_COLLECTION_STATUS.Cancelled:
      return 'treasury_checks_and_drafts.statuses.cancelled';
    case PAYMENT_COLLECTION_STATUS.DepositedSupplier:
      return 'treasury_checks_and_drafts.statuses.deposited_supplier';
    case PAYMENT_COLLECTION_STATUS.PaidSupplier:
      return 'treasury_checks_and_drafts.statuses.paid_supplier';
    case PAYMENT_COLLECTION_STATUS.Pending:
    default:
      return 'treasury_checks_and_drafts.statuses.pending';
  }
};

export const getPaymentStatusClassName = (status?: PAYMENT_COLLECTION_STATUS) => {
  switch (status) {
    case PAYMENT_COLLECTION_STATUS.Deposited:
      return 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400';
    case PAYMENT_COLLECTION_STATUS.Paid:
      return 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400';
    case PAYMENT_COLLECTION_STATUS.Rejected:
      return 'border-red-100 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400';
    case PAYMENT_COLLECTION_STATUS.Cancelled:
      return 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400';
    case PAYMENT_COLLECTION_STATUS.DepositedSupplier:
      return 'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400';
    case PAYMENT_COLLECTION_STATUS.PaidSupplier:
      return 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-800/20 dark:text-emerald-300';
    case PAYMENT_COLLECTION_STATUS.Pending:
    default:
      return 'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400';
  }
};

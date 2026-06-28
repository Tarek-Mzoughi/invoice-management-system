import React from 'react';
import { PaymentCondition } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useTranslation } from 'react-i18next';
import { PaymentConditionCreateDialog } from './dialogs/PaymentConditionCreateDialog';
import { PaymentConditionUpdateDialog } from './dialogs/PaymentConditionUpdateDialog';
import { PaymentConditionDeleteDialog } from './dialogs/PaymentConditionDeleteDialog';
import { usePaymentConditionManager } from './hooks/usePaymentConditionManager';
import { api } from '@/api';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { getPaymentConditionColumns } from './data-table/columns';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentConditionActionsContext } from './data-table/ActionsContext';

interface PaymentConditionPortalProps {
  className?: string;
}
const PaymentConditionPortal: React.FC<PaymentConditionPortalProps> = ({ className }) => {
  //next-router
  const router = useRouter();
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('payment_condition.singular') }
    ]);
  }, [router.locale, tCommon, tSettings, setRoutes]);

  const paymentConditionManager = usePaymentConditionManager();

  const [page, setPage] = React.useState(1);
  const { value: debouncedPage, loading: paging } = useDebounce<number>(page, 500);

  const [size, setSize] = React.useState(5);
  const { value: debouncedSize, loading: resizing } = useDebounce<number>(size, 500);

  const [sortDetails, setSortDetails] = React.useState({ order: true, sortKey: 'id' });
  const { value: debouncedSortDetails, loading: sorting } = useDebounce<typeof sortDetails>(
    sortDetails,
    500
  );

  const [searchTerm, setSearchTerm] = React.useState('');
  const { value: debouncedSearchTerm, loading: searching } = useDebounce<string>(searchTerm, 500);

  const [createDialog, setCreateDialog] = React.useState(false);
  const [updateDialog, setUpdateDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: paymentConditionsResp,
    refetch: refetchPaymentConditions
  } = useQuery({
    queryKey: [
      'payment-conditions',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.paymentCondition.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm
      )
  });

  const paymentConditions = React.useMemo(() => {
    return paymentConditionsResp?.data || [];
  }, [paymentConditionsResp]);

  const context: DataTableConfig<PaymentCondition> = {
    singularName: tSettings('payment_condition.singular'),
    pluralName: tSettings('payment_condition.plural'),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: paymentConditionsResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey }),
    //actions
    updateCallback: (paymentCondition: PaymentCondition) => {
      paymentConditionManager.setPaymentCondition(paymentCondition);
      setUpdateDialog(true);
    },
    deleteCallback: (paymentCondition: PaymentCondition) => {
      paymentConditionManager.setPaymentCondition(paymentCondition);
      setDeleteDialog(true);
    }
  };

  //create payment condition
  const { mutate: createPaymentCondition, isPending: isCreatePending } = useMutation({
    mutationFn: (data: PaymentCondition) => api.paymentCondition.create(data),
    onSuccess: () => {
      toast.success(tSettings('payment_condition.messages.create_success'));
      refetchPaymentConditions();
      setCreateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('', error, tSettings('payment_condition.messages.create_error'))
      );
    }
  });

  //update payment condition
  const { mutate: updatePaymentCondition, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: PaymentCondition) => api.paymentCondition.update(data),
    onSuccess: () => {
      toast.success(tSettings('payment_condition.messages.update_success'));
      refetchPaymentConditions();
      setUpdateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('', error, tSettings('payment_condition.messages.update_error'))
      );
    }
  });

  //remove payment condition
  const { mutate: removePaymentCondition, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.paymentCondition.remove(id),
    onSuccess: () => {
      if (paymentConditions?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tSettings('payment_condition.messages.delete_success'));
      refetchPaymentConditions();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tSettings('payment_condition.messages.delete_error')));
    }
  });

  const handlePaymentConditionSubmit = (
    paymentCondition: PaymentCondition,
    callback: (paymentCondition: PaymentCondition) => void
  ): boolean => {
    const validation = api.paymentCondition.validate(paymentCondition);
    if (validation.message) {
      toast.error(validation.message);
      return false;
    } else {
      callback(paymentCondition);
      paymentConditionManager.reset();
      return true;
    }
  };

  const isPending =
    isFetchPending ||
    isCreatePending ||
    isUpdatePending ||
    isDeletePending ||
    paging ||
    resizing ||
    searching ||
    sorting;

  if (error) return 'An error has occurred: ' + error.message;

  return (
    <PaymentConditionActionsContext.Provider value={context as any}>
      <PaymentConditionCreateDialog
        open={createDialog}
        isCreatePending={isCreatePending}
        createPaymentCondition={() => {
          handlePaymentConditionSubmit(
            paymentConditionManager.getPaymentCondition(),
            createPaymentCondition
          );
        }}
        onClose={() => {
          setCreateDialog(false);
          paymentConditionManager.reset();
        }}
      />
      <PaymentConditionUpdateDialog
        open={updateDialog}
        updatePaymentCondition={() => {
          handlePaymentConditionSubmit(
            paymentConditionManager.getPaymentCondition(),
            updatePaymentCondition
          );
        }}
        isUpdatePending={isUpdatePending}
        onClose={() => {
          setUpdateDialog(false);
          paymentConditionManager.reset();
        }}
      />
      <PaymentConditionDeleteDialog
        open={deleteDialog}
        deletePaymentCondition={() => {
          paymentConditionManager?.id && removePaymentCondition(paymentConditionManager?.id);
        }}
        isDeletionPending={isDeletePending}
        label={paymentConditionManager?.label}
        onClose={() => {
          setDeleteDialog(false);
        }}
      />
      <div className={cn('flex flex-1 flex-col overflow-auto px-4 py-5 lg:px-8 lg:py-6', className)}>
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
          <div className="flex flex-wrap items-start gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg px-4 text-sm font-medium transition-all"
              onClick={() => router.push('/settings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon('commands.back')}
            </Button>
          </div>

          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
              {tSettings('payment_condition.singular')}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {tSettings('payment_condition.card_description')}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold">{tSettings('payment_condition.singular')}</h2>
              <Button
                className="h-9 rounded-md px-4 font-medium"
                onClick={() => setCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tCommon('commands.create')} {tCommon('words.or')} {tSettings('payment_condition.singular')}
              </Button>
            </div>
            <DataTable
              className="flex flex-col flex-1 overflow-hidden"
              containerClassName="overflow-auto"
              data={paymentConditions}
              columns={getPaymentConditionColumns(tSettings)}
              context={context}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
    </PaymentConditionActionsContext.Provider>
  );
};

export default PaymentConditionPortal;

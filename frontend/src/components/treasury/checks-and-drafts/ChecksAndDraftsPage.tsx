import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Eye,
  Filter,
  RotateCcw,
  Search,
  Upload
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { getPaymentStatusClassName, getPaymentStatusTranslationKey } from '@/utils/payment.utils';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useDebounce } from '@/hooks/other/useDebounce';
import { cn } from '@/lib/utils';
import {
  ACTIVITY_TYPE,
  BANK_ACCOUNT_TYPE,
  Payment,
  PAYMENT_COLLECTION_STATUS,
  PAYMENT_MODE
} from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { CheckDraftDetailsSheet } from './CheckDraftDetailsSheet';
import { DepositInstrumentDialog } from './DepositInstrumentDialog';
import { MarkInstrumentPaidDialog } from './MarkInstrumentPaidDialog';
import { RejectInstrumentDialog } from './RejectInstrumentDialog';
import { CancelDepositDialog } from './CancelDepositDialog';
import {
  formatDateTime,
  formatPaymentAmount,
  getEntityName,
  getIntlLocale,
  getPaymentTypeClassName,
  getPaymentTypeTranslationKey,
  getTreasuryAccountName,
  WORKFLOW_COLLECTION_STATUSES
} from './utils';

const rowActionButtonClassName =
  'inline-flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-zinc-100 dark:hover:bg-zinc-800';

export const ChecksAndDraftsPage: React.FC = () => {
  const router = useRouter();
  const { t: tCommon, i18n } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes } = useBreadcrumb();

  const locale = React.useMemo(
    () => getIntlLocale(i18n.resolvedLanguage || i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );

  const [activityType, setActivityType] = React.useState<ACTIVITY_TYPE>(ACTIVITY_TYPE.SELLING);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(20);
  const [searchText, setSearchText] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [dueStartDate, setDueStartDate] = React.useState('');
  const [dueEndDate, setDueEndDate] = React.useState('');
  const [treasuryAccountId, setTreasuryAccountId] = React.useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [paymentToDeposit, setPaymentToDeposit] = React.useState<Payment | null>(null);
  const [paymentToPay, setPaymentToPay] = React.useState<Payment | null>(null);
  const [paymentToReject, setPaymentToReject] = React.useState<Payment | null>(null);
  const [paymentToCancelDeposit, setPaymentToCancelDeposit] = React.useState<Payment | null>(null);

  const { value: debouncedPage } = useDebounce(page, 250);
  const { value: debouncedSize } = useDebounce(size, 250);
  const { value: debouncedSearch } = useDebounce(searchText, 400);

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.treasury') },
      { title: tCommon('submenu.checks_and_drafts') }
    ]);
  }, [router.locale, setRoutes, tCommon]);

  const { data: treasuryAccountsResp, isPending: isTreasuryAccountsPending } = useQuery({
    queryKey: ['bank-account-options', 'checks-drafts'],
    queryFn: () => api.bankAccount.find()
  });
  const treasuryAccounts = React.useMemo(() => treasuryAccountsResp || [], [treasuryAccountsResp]);
  const bankAccounts = React.useMemo(
    () => treasuryAccounts.filter((account) => account.type === BANK_ACCOUNT_TYPE.BANK),
    [treasuryAccounts]
  );

  const { data: cabinets } = useQuery({
    queryKey: ['cabinets-list'],
    queryFn: () => api.cabinet.findAll()
  });
  const companyName = React.useMemo(() => cabinets?.[0]?.enterpriseName || '', [cabinets]);

  const {
    data: paymentsResp,
    isPending: isPaymentsPending,
    refetch: refetchPayments
  } = useQuery({
    queryKey: [
      'checks-drafts',
      debouncedPage,
      debouncedSize,
      debouncedSearch,
      activityType,
      typeFilter,
      statusFilter,
      dueStartDate,
      dueEndDate,
      treasuryAccountId
    ],
    queryFn: () =>
      api.payment.findNegotiablePaginated(
        debouncedPage,
        debouncedSize,
        'DESC',
        'dueDate',
        debouncedSearch,
        activityType,
        {
          mode: typeFilter || undefined,
          collectionStatus: (statusFilter || undefined) as PAYMENT_COLLECTION_STATUS | undefined,
          dueStartDate: dueStartDate || undefined,
          dueEndDate: dueEndDate || undefined,
          treasuryAccountId: treasuryAccountId ? parseInt(treasuryAccountId, 10) : undefined
        }
      )
  });

  const payments = React.useMemo(() => paymentsResp?.data || [], [paymentsResp]);
  const totalItems = paymentsResp?.meta.itemCount ?? 0;
  const totalPageCount = paymentsResp?.meta.pageCount ?? 1;
  const currentPage = paymentsResp?.meta.page ?? page;
  const currentPageSize = paymentsResp?.meta.take ?? size;
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : rangeStart + payments.length - 1;

  const closeActionDialogs = React.useCallback(() => {
    setPaymentToDeposit(null);
    setPaymentToPay(null);
    setPaymentToReject(null);
    setPaymentToCancelDeposit(null);
  }, []);

  const syncUpdatedPayment = React.useCallback(
    async (updatedPayment?: Payment | null) => {
      if (updatedPayment && selectedPayment?.id === updatedPayment.id) {
        setSelectedPayment(updatedPayment);
      }
      closeActionDialogs();
      await refetchPayments();
    },
    [closeActionDialogs, refetchPayments, selectedPayment?.id]
  );

  const { mutate: depositInstrument, isPending: isDepositPending } = useMutation({
    mutationFn: (params: { paymentId: number; bankAccountId: number }) =>
      api.payment.depositInstrument(params.paymentId, params.bankAccountId),
    onSuccess: async (updatedPayment) => {
      toast.success(tSettings('treasury_checks_and_drafts.toasts.deposit_success'));
      await syncUpdatedPayment(updatedPayment);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          'settings',
          error,
          tSettings('treasury_checks_and_drafts.toasts.deposit_error')
        )
      );
    }
  });

  const { mutate: markInstrumentPaid, isPending: isMarkPaidPending } = useMutation({
    mutationFn: (paymentId: number) => api.payment.markInstrumentPaid(paymentId),
    onSuccess: async (updatedPayment) => {
      toast.success(tSettings('treasury_checks_and_drafts.toasts.mark_paid_success'));
      await syncUpdatedPayment(updatedPayment);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          'settings',
          error,
          tSettings('treasury_checks_and_drafts.toasts.mark_paid_error')
        )
      );
    }
  });

  const { mutate: rejectInstrument, isPending: isRejectPending } = useMutation({
    mutationFn: (params: { paymentId: number; reason?: string }) =>
      api.payment.rejectInstrument(params.paymentId, params.reason),
    onSuccess: async (updatedPayment) => {
      toast.success(tSettings('treasury_checks_and_drafts.toasts.reject_success'));
      await syncUpdatedPayment(updatedPayment);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          'settings',
          error,
          tSettings('treasury_checks_and_drafts.toasts.reject_error')
        )
      );
    }
  });

  const { mutate: cancelDeposit, isPending: isCancelDepositPending } = useMutation({
    mutationFn: (paymentId: number) => api.payment.cancelInstrumentDeposit(paymentId),
    onSuccess: async (updatedPayment) => {
      toast.success(tSettings('treasury_checks_and_drafts.toasts.cancel_deposit_success'));
      await syncUpdatedPayment(updatedPayment);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          'settings',
          error,
          tSettings('treasury_checks_and_drafts.toasts.cancel_deposit_error')
        )
      );
    }
  });

  const loading = isPaymentsPending || isTreasuryAccountsPending;

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-6 overflow-hidden px-6 py-7 lg:px-8">
        <div className="shrink-0">
          <h1 className="text-[2.6rem] font-bold tracking-[-0.03em] text-zinc-900 dark:text-zinc-100">
            {tSettings('treasury_checks_and_drafts.title')}
          </h1>
          <p className="mt-1 text-[1.05rem] text-zinc-500 dark:text-zinc-400">
            {tSettings('treasury_checks_and_drafts.description')}
          </p>
        </div>

        <div className="shrink-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="grid grid-cols-2 overflow-hidden rounded-sm border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <button
                type="button"
                className={cn(
                  'h-8 px-4 text-base font-medium transition sm:h-10',
                  activityType === ACTIVITY_TYPE.SELLING
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                )}
                onClick={() => {
                  setActivityType(ACTIVITY_TYPE.SELLING);
                  setPage(1);
                }}
              >
                {tSettings('treasury_checks_and_drafts.tabs.client')}
              </button>
              <button
                type="button"
                className={cn(
                  'h-8 px-4 text-base font-medium transition sm:h-10',
                  activityType === ACTIVITY_TYPE.BUYING
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                )}
                onClick={() => {
                  setActivityType(ACTIVITY_TYPE.BUYING);
                  setPage(1);
                }}
              >
                {tSettings('treasury_checks_and_drafts.tabs.supplier')}
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 rounded-sm border-zinc-200 dark:border-zinc-700"
              onClick={() => setShowAdvancedFilters((current) => !current)}
            >
              <Filter className="h-4 w-4" />
              {tSettings('treasury_checks_and_drafts.actions.filters')}
            </Button>
          </div>

          {showAdvancedFilters ? (
            <div className="grid gap-4 rounded-sm border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1 xl:col-span-2">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {tSettings('treasury_checks_and_drafts.filters.search')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    className="h-9 border-zinc-200 pl-9 dark:border-zinc-700 dark:bg-zinc-800"
                    value={searchText}
                    onChange={(event) => {
                      setSearchText(event.target.value);
                      setPage(1);
                    }}
                    placeholder={tSettings('treasury_checks_and_drafts.placeholders.search')}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {tSettings('treasury_checks_and_drafts.filters.type')}
                </label>
                <Select
                  value={typeFilter || '__all__'}
                  onValueChange={(value) => {
                    setTypeFilter(value === '__all__' ? '' : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                    <SelectValue placeholder={tSettings('treasury_checks_and_drafts.placeholders.all_types')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      {tSettings('treasury_checks_and_drafts.placeholders.all_types')}
                    </SelectItem>
                    <SelectItem value={PAYMENT_MODE.Check}>
                      {tSettings('treasury_checks_and_drafts.types.check')}
                    </SelectItem>
                    <SelectItem value={PAYMENT_MODE.BillOfExchange}>
                      {tSettings('treasury_checks_and_drafts.types.bill_of_exchange')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {tSettings('treasury_checks_and_drafts.filters.status')}
                </label>
                <Select
                  value={statusFilter || '__all__'}
                  onValueChange={(value) => {
                    setStatusFilter(value === '__all__' ? '' : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                    <SelectValue placeholder={tSettings('treasury_checks_and_drafts.placeholders.all_statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      {tSettings('treasury_checks_and_drafts.placeholders.all_statuses')}
                    </SelectItem>
                    {WORKFLOW_COLLECTION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        <span
                          className={cn(
                            'inline-flex rounded-md border px-3 py-1 text-xs font-semibold',
                            getPaymentStatusClassName(status)
                          )}
                        >
                          {tSettings(getPaymentStatusTranslationKey(status))}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {tSettings('treasury_checks_and_drafts.filters.account')}
                </label>
                <Select
                  value={treasuryAccountId || '__all__'}
                  onValueChange={(value) => {
                    setTreasuryAccountId(value === '__all__' ? '' : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                    <SelectValue placeholder={tSettings('treasury_checks_and_drafts.placeholders.all_accounts')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      {tSettings('treasury_checks_and_drafts.placeholders.all_accounts')}
                    </SelectItem>
                    {treasuryAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id?.toString() || ''}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {tSettings('treasury_checks_and_drafts.filters.due_start')}
                </label>
                <Input
                  type="date"
                  className="h-9 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
                  value={dueStartDate}
                  onChange={(event) => {
                    setDueStartDate(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {tSettings('treasury_checks_and_drafts.filters.due_end')}
                </label>
                <Input
                  type="date"
                  className="h-9 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
                  value={dueEndDate}
                  onChange={(event) => {
                    setDueEndDate(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800">
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  {[
                    'type',
                    'reference',
                    'entity',
                    'amount',
                    'due_date',
                    'account',
                    'status',
                    'actions'
                  ].map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100"
                    >
                      {tSettings(`treasury_checks_and_drafts.table.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Spinner show />
                    </td>
                  </tr>
                ) : payments.length ? (
                  payments.map((payment) => {
                    const collectionStatus =
                      payment.collectionStatus ?? PAYMENT_COLLECTION_STATUS.Pending;
                    const isPendingCollection =
                      collectionStatus === PAYMENT_COLLECTION_STATUS.Pending;
                    const isDeposited =
                      collectionStatus === PAYMENT_COLLECTION_STATUS.Deposited;
                    const isPaid =
                      collectionStatus === PAYMENT_COLLECTION_STATUS.Paid;

                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-md border px-3 py-1 text-xs font-semibold',
                              getPaymentTypeClassName(payment.mode)
                            )}
                          >
                            {tSettings(getPaymentTypeTranslationKey(payment.mode))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {payment.reference || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                          {getEntityName(payment)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatPaymentAmount(payment, locale)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                          {formatDateTime(payment.dueDate, locale)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                          {getTreasuryAccountName(payment)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-md border px-3 py-1 text-xs font-semibold',
                              getPaymentStatusClassName(collectionStatus)
                            )}
                          >
                            {tSettings(getPaymentStatusTranslationKey(collectionStatus))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(rowActionButtonClassName, 'text-zinc-700 dark:text-zinc-200')}
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {tSettings('treasury_checks_and_drafts.actions.view_details')}
                              </TooltipContent>
                            </Tooltip>

                            {isPendingCollection ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={cn(
                                      rowActionButtonClassName,
                                      'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                    )}
                                    onClick={() => setPaymentToDeposit(payment)}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {tSettings('treasury_checks_and_drafts.actions.deposit')}
                                </TooltipContent>
                              </Tooltip>
                            ) : null}

                            {isDeposited ? (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className={cn(
                                        rowActionButtonClassName,
                                        'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                                      )}
                                      onClick={() => setPaymentToPay(payment)}
                                    >
                                      <CheckCheck className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {tSettings('treasury_checks_and_drafts.actions.mark_paid')}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className={cn(
                                        rowActionButtonClassName,
                                        'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                                      )}
                                      onClick={() => setPaymentToReject(payment)}
                                    >
                                      <CircleX className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {tSettings('treasury_checks_and_drafts.actions.reject')}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className={cn(
                                        rowActionButtonClassName,
                                        'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20'
                                      )}
                                      onClick={() => setPaymentToCancelDeposit(payment)}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {tSettings('treasury_checks_and_drafts.actions.cancel_deposit')}
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            ) : null}

                            {isPaid ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={cn(
                                      rowActionButtonClassName,
                                      'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20'
                                    )}
                                    onClick={() => setPaymentToCancelDeposit(payment)}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {tSettings('treasury_checks_and_drafts.actions.cancel_deposit')}
                                </TooltipContent>
                              </Tooltip>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      {tSettings('treasury_checks_and_drafts.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 flex-col gap-4 border-t border-zinc-200 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span>{tSettings('treasury_checks_and_drafts.pagination.rows')}</span>
              <Select
                value={size.toString()}
                onValueChange={(value) => {
                  setSize(parseInt(value, 10));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[88px] border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-4 lg:justify-between">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {tSettings('treasury_checks_and_drafts.pagination.page', {
                  page: currentPage,
                  totalPages: Math.max(totalPageCount, 1)
                })}
              </span>

              <span>
                {tSettings('treasury_checks_and_drafts.pagination.range', {
                  start: rangeStart,
                  end: rangeEnd,
                  total: totalItems
                })}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 border-zinc-200 dark:border-zinc-700"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 border-zinc-200 dark:border-zinc-700"
                onClick={() => setPage((current) => Math.min(totalPageCount || 1, current + 1))}
                disabled={page >= totalPageCount}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CheckDraftDetailsSheet
          open={Boolean(selectedPayment)}
          payment={selectedPayment}
          companyName={companyName}
          locale={locale}
          onClose={() => setSelectedPayment(null)}
        />

        <DepositInstrumentDialog
          open={Boolean(paymentToDeposit)}
          payment={paymentToDeposit}
          bankAccounts={bankAccounts}
          locale={locale}
          isPending={isDepositPending}
          onClose={() => setPaymentToDeposit(null)}
          onConfirm={(bankAccountId) => {
            if (!paymentToDeposit?.id) return;
            depositInstrument({ paymentId: paymentToDeposit.id, bankAccountId });
          }}
        />

        <MarkInstrumentPaidDialog
          open={Boolean(paymentToPay)}
          payment={paymentToPay}
          locale={locale}
          isPending={isMarkPaidPending}
          onClose={() => setPaymentToPay(null)}
          onConfirm={() => {
            if (!paymentToPay?.id) return;
            markInstrumentPaid(paymentToPay.id);
          }}
        />

        <RejectInstrumentDialog
          open={Boolean(paymentToReject)}
          payment={paymentToReject}
          isPending={isRejectPending}
          onClose={() => setPaymentToReject(null)}
          onConfirm={(reason) => {
            if (!paymentToReject?.id) return;
            rejectInstrument({ paymentId: paymentToReject.id, reason });
          }}
        />

        <CancelDepositDialog
          open={Boolean(paymentToCancelDeposit)}
          payment={paymentToCancelDeposit}
          isPending={isCancelDepositPending}
          onClose={() => setPaymentToCancelDeposit(null)}
          onConfirm={() => {
            if (!paymentToCancelDeposit?.id) return;
            cancelDeposit(paymentToCancelDeposit.id);
          }}
        />
      </div>
    </TooltipProvider>
  );
};

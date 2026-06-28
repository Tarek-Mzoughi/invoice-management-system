import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Paperclip,
  Search,
  SlidersHorizontal,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useDebounce } from '@/hooks/other/useDebounce';
import { cn } from '@/lib/utils';
import {
  BankAccount,
  TreasuryMovement,
  TREASURY_MOVEMENT_DIRECTION,
  TREASURY_MOVEMENT_KIND
} from '@/types';
import { TransactionDeleteDialog } from './TransactionDeleteDialog';
import { TransactionReceiptDialog } from './TransactionReceiptDialog';
import { exportTransactionsToExcel, exportTransactionsToPdf } from './transactionExport';

const getIntlLocale = (language?: string) =>
  language?.toLowerCase().startsWith('fr') ? 'fr-FR' : 'en-US';

const formatReference = (movement: TreasuryMovement) => {
  const date = movement.movementDate ? new Date(movement.movementDate) : new Date(movement.createdAt || '');
  const year = date.getFullYear();
  const id = String(movement.id ?? 0).padStart(5, '0');
  return `TX-${year}-${id}`;
};

const formatDate = (movement: TreasuryMovement, locale: string) => {
  const date = movement.movementDate ? new Date(movement.movementDate) : null;
  if (!date) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatAmount = (
  amount: number,
  locale: string,
  currency?: { digitAfterComma?: number; symbol?: string; code?: string }
) => {
  const digits = currency?.digitAfterComma ?? 3;
  const symbol = currency?.symbol || currency?.code || 'DT';
  return `${amount.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })} ${symbol}`;
};

const parseDateValue = (value: string | Date | undefined) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatExportDate = (value: string | Date | undefined, locale: string) => {
  const date = parseDateValue(value);
  if (!date) return '-';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const getFileDateStamp = (value: Date = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getKindTranslationKey = (kind?: TREASURY_MOVEMENT_KIND) => {
  switch (kind) {
    case TREASURY_MOVEMENT_KIND.EXPENSE:
      return 'expense';
    case TREASURY_MOVEMENT_KIND.INCOME:
      return 'income';
    case TREASURY_MOVEMENT_KIND.TRANSFER:
      return 'transfer';
    case TREASURY_MOVEMENT_KIND.ADJUSTMENT:
      return 'adjustment';
    default:
      return undefined;
  }
};

type TransactionWithAttachments = TreasuryMovement & {
  attachmentIds?: number[];
  attachments?: unknown[];
};

const getAttachmentCount = (movement: TreasuryMovement) => {
  const movementWithAttachments = movement as TransactionWithAttachments;
  const attachmentIdsCount = Array.isArray(movementWithAttachments.attachmentIds)
    ? movementWithAttachments.attachmentIds.filter((attachmentId) => attachmentId != null).length
    : 0;
  const attachmentsCount = Array.isArray(movementWithAttachments.attachments)
    ? movementWithAttachments.attachments.filter(Boolean).length
    : 0;

  return Math.max(attachmentIdsCount, attachmentsCount);
};

const buildFilters = (params: {
  accountId?: string;
  kind?: string;
  dateStart?: string;
  dateEnd?: string;
  search?: string;
  amountMin?: string;
  amountMax?: string;
}): string => {
  const conditions: string[] = [];

  if (params.accountId) {
    conditions.push(`accountId||$eq||${params.accountId}`);
  }

  if (params.kind) {
    conditions.push(`kind||$eq||${params.kind}`);
  }

  if (params.dateStart && params.dateEnd) {
    conditions.push(`movementDate||$between||${params.dateStart},${params.dateEnd}`);
  } else if (params.dateStart) {
    conditions.push(`movementDate||$gte||${params.dateStart}`);
  } else if (params.dateEnd) {
    conditions.push(`movementDate||$lte||${params.dateEnd}`);
  }

  if (params.amountMin && Number(params.amountMin) > 0) {
    conditions.push(`amount||$gte||${params.amountMin}`);
  }

  if (params.amountMax && Number(params.amountMax) > 0 && params.amountMax !== '∞') {
    conditions.push(`amount||$lte||${params.amountMax}`);
  }

  if (params.search) {
    const searchConditions = [`label||$cont||${params.search}`, `notes||$cont||${params.search}`];
    conditions.push(searchConditions.join('||$or||'));
  }

  return conditions.join(';');
};

export const TransactionList: React.FC = () => {
  const { t: tCommon, i18n } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const router = useRouter();
  const { setRoutes } = useBreadcrumb();

  const locale = React.useMemo(
    () => getIntlLocale(i18n.resolvedLanguage || i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );

  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(10);
  const [accountId, setAccountId] = React.useState<string>('');
  const [kind, setKind] = React.useState<string>('');
  const [dateStart, setDateStart] = React.useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [dateEnd, setDateEnd] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [searchText, setSearchText] = React.useState('');
  const [amountMin, setAmountMin] = React.useState('0');
  const [amountMax, setAmountMax] = React.useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [receiptTransaction, setReceiptTransaction] = React.useState<TreasuryMovement | null>(null);
  const [transactionToDelete, setTransactionToDelete] = React.useState<TreasuryMovement | null>(null);
  const [exportingFormat, setExportingFormat] = React.useState<'pdf' | 'excel' | null>(null);

  const { value: debouncedPage } = useDebounce(page, 300);
  const { value: debouncedSize } = useDebounce(size, 300);
  const { value: debouncedSearch } = useDebounce(searchText, 500);
  const { value: debouncedAmountMin } = useDebounce(amountMin, 500);
  const { value: debouncedAmountMax } = useDebounce(amountMax, 500);

  React.useEffect(() => {
    if (router.query.accountId) {
      setAccountId(router.query.accountId as string);
    }
  }, [router.query.accountId]);

  React.useEffect(() => {
    setRoutes?.([{ title: tCommon('menu.treasury') }, { title: tCommon('submenu.transactions') }]);
  }, [setRoutes, tCommon]);

  const filterString = React.useMemo(
    () =>
      buildFilters({
        accountId,
        kind,
        dateStart,
        dateEnd,
        search: debouncedSearch,
        amountMin: debouncedAmountMin,
        amountMax: debouncedAmountMax
      }),
    [accountId, kind, dateStart, dateEnd, debouncedSearch, debouncedAmountMin, debouncedAmountMax]
  );

  const { data: accountsData } = useQuery({
    queryKey: ['bank-accounts-all'],
    queryFn: () => api.bankAccount.find()
  });
  const accounts: BankAccount[] = React.useMemo(() => accountsData || [], [accountsData]);
  const selectedAccountName = React.useMemo(() => {
    if (!accountId) {
      return tSettings('treasury_transaction.export.all_accounts');
    }

    return (
      accounts.find((account) => account.id?.toString() === accountId)?.name ||
      tSettings('treasury_transaction.export.all_accounts')
    );
  }, [accountId, accounts, tSettings]);

  const { data: cabinets } = useQuery({
    queryKey: ['cabinets-list'],
    queryFn: () => api.cabinet.findAll()
  });
  const companyName = React.useMemo(() => cabinets?.[0]?.enterpriseName || '', [cabinets]);

  const {
    data: transactionsResp,
    isPending,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['treasury-movements', debouncedPage, debouncedSize, filterString],
    queryFn: () =>
      api.treasuryMovement.findPaginated(
        debouncedPage,
        debouncedSize,
        'DESC',
        'movementDate',
        filterString
      )
  });

  const transactions = React.useMemo(() => transactionsResp?.data || [], [transactionsResp]);
  const totalItems = transactionsResp?.meta.itemCount ?? 0;
  const totalPageCount = transactionsResp?.meta.pageCount ?? 1;
  const currentPage = transactionsResp?.meta.page ?? page;
  const currentPageSize = transactionsResp?.meta.take ?? size;
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : rangeStart + transactions.length - 1;

  const runningBalances = React.useMemo(() => {
    const balanceByAccount: Record<string, number> = {};

    return transactions.map((transaction) => {
      const accountKey =
        transaction.accountId?.toString() || transaction.account?.id?.toString() || '_unknown';

      if (!(accountKey in balanceByAccount)) {
        balanceByAccount[accountKey] = 0;
      }

      const amount = transaction.amount ?? 0;
      if (transaction.direction === TREASURY_MOVEMENT_DIRECTION.IN) {
        balanceByAccount[accountKey] += amount;
      } else {
        balanceByAccount[accountKey] -= amount;
      }

      return balanceByAccount[accountKey];
    });
  }, [transactions]);

  const { mutate: deleteTransaction, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.treasuryMovement.remove(id),
    onSuccess: async () => {
      toast.success(tSettings('treasury_transaction.toasts.delete_success'));
      setTransactionToDelete(null);
      if (transactions.length === 1 && page > 1) {
        setPage(page - 1);
      }
      await refetchTransactions();
    },
    onError: () => {
      toast.error(tSettings('treasury_transaction.toasts.delete_error'));
    }
  });

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (exportingFormat) {
      return;
    }

    setExportingFormat(format);

    try {
      const movements = await api.treasuryMovement.findAll(filterString);

      if (!movements.length) {
        toast.info(tSettings('treasury_transaction.toasts.export_empty'));
        return;
      }

      const exportDate = new Date();
      const fileDateStamp = getFileDateStamp(exportDate);
      const fileName = `${tSettings('treasury_transaction.export.filename_prefix')}_${fileDateStamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      const exportLabels = {
        reference: tSettings('treasury_transaction.table.reference'),
        date: tSettings('treasury_transaction.receipt.date_label'),
        account: tSettings('treasury_transaction.table.account'),
        debit: tSettings('treasury_transaction.table.debit'),
        credit: tSettings('treasury_transaction.table.credit'),
        balance: tSettings('treasury_transaction.table.balance'),
        reason: tSettings('treasury_transaction.table.reason'),
        total: tSettings('treasury_transaction.export.total')
      };
      const exportMeta = {
        title: tSettings('treasury_transaction.title'),
        sheetName: tSettings('treasury_transaction.export.sheet_name'),
        companyName: companyName || tSettings('treasury_transaction.receipt.company_fallback'),
        generatedAt: tSettings('treasury_transaction.export.generated_at', {
          date: formatExportDate(exportDate, locale)
        }),
        period: tSettings('treasury_transaction.export.period', {
          from: formatExportDate(dateStart, locale),
          to: formatExportDate(dateEnd, locale)
        }),
        accountScope: tSettings('treasury_transaction.export.account_scope', {
          account: selectedAccountName
        })
      };

      if (format === 'pdf') {
        await exportTransactionsToPdf({
          movements,
          meta: exportMeta,
          labels: exportLabels,
          fileName,
          locale
        });
        toast.success(tSettings('treasury_transaction.toasts.export_pdf_success'));
        return;
      }

      await exportTransactionsToExcel({
        movements,
        meta: exportMeta,
        labels: exportLabels,
        fileName,
        locale
      });
      toast.success(tSettings('treasury_transaction.toasts.export_excel_success'));
    } catch {
      toast.error(
        tSettings(
          format === 'pdf'
            ? 'treasury_transaction.toasts.export_pdf_error'
            : 'treasury_transaction.toasts.export_excel_error'
        )
      );
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-6 overflow-hidden px-4 py-6">
      <div className="flex shrink-0 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {tSettings('treasury_transaction.title')}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {tSettings('treasury_transaction.description')}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-sm border-zinc-200 text-sm dark:border-zinc-700"
              disabled={Boolean(exportingFormat)}
            >
              {exportingFormat ? <Spinner size="small" className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {tSettings('treasury_transaction.actions.export')}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              disabled={Boolean(exportingFormat)}
              onClick={() => void handleExport('pdf')}
            >
              <FileText className="mr-2 h-4 w-4" />
              {tSettings('treasury_transaction.actions.export_pdf')}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={Boolean(exportingFormat)}
              onClick={() => void handleExport('excel')}
            >
              <FileText className="mr-2 h-4 w-4" />
              {tSettings('treasury_transaction.actions.export_excel')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="shrink-0 space-y-3 rounded-sm border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {tSettings('treasury_transaction.filters.account')}
            </label>
            <Select
              value={accountId}
              onValueChange={(value) => {
                setAccountId(value === '__all__' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                <SelectValue placeholder={tSettings('treasury_transaction.placeholders.all_accounts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">
                  {tSettings('treasury_transaction.placeholders.all_accounts')}
                </SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id?.toString() || ''}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {tSettings('treasury_transaction.filters.kind')}
            </label>
            <Select
              value={kind}
              onValueChange={(value) => {
                setKind(value === '__all__' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                <SelectValue placeholder={tSettings('treasury_transaction.placeholders.all_kinds')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">
                  {tSettings('treasury_transaction.placeholders.all_kinds')}
                </SelectItem>
                <SelectItem value={TREASURY_MOVEMENT_KIND.EXPENSE}>
                  {tSettings('treasury_transaction.kinds.expense')}
                </SelectItem>
                <SelectItem value={TREASURY_MOVEMENT_KIND.INCOME}>
                  {tSettings('treasury_transaction.kinds.income')}
                </SelectItem>
                <SelectItem value={TREASURY_MOVEMENT_KIND.TRANSFER}>
                  {tSettings('treasury_transaction.kinds.transfer')}
                </SelectItem>
                <SelectItem value={TREASURY_MOVEMENT_KIND.ADJUSTMENT}>
                  {tSettings('treasury_transaction.kinds.adjustment')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[160px] space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {tSettings('treasury_transaction.filters.date_start')}
            </label>
            <Input
              type="date"
              className="h-9 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              value={dateStart}
              onChange={(event) => {
                setDateStart(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="min-w-[160px] space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {tSettings('treasury_transaction.filters.date_end')}
            </label>
            <Input
              type="date"
              className="h-9 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              value={dateEnd}
              onChange={(event) => {
                setDateEnd(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <Button
            variant="outline"
            className="h-9 w-9 shrink-0 rounded-sm border-zinc-200 p-0 dark:border-zinc-700"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title={tSettings('treasury_transaction.filters.advanced')}
            aria-label={tSettings('treasury_transaction.filters.advanced')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showAdvancedFilters && (
          <div className="flex flex-wrap items-end gap-4 border-t border-zinc-100 pt-3 dark:border-zinc-700">
            <div className="min-w-[200px] flex-1 space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {tSettings('treasury_transaction.filters.search')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  className="h-9 border-zinc-200 pl-9 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder={tSettings('treasury_transaction.placeholders.search')}
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {tSettings('treasury_transaction.filters.amount_range')}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  className="h-9 w-[120px] border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
                  value={amountMin}
                  onChange={(event) => {
                    setAmountMin(event.target.value);
                    setPage(1);
                  }}
                />
                <Input
                  className="h-9 w-[120px] border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder={tSettings('treasury_transaction.placeholders.max_amount')}
                  value={amountMax}
                  onChange={(event) => {
                    setAmountMax(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800">
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  {tSettings('treasury_transaction.table.reference')}
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  {tSettings('treasury_transaction.table.account')}
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  {tSettings('treasury_transaction.table.debit')}
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  {tSettings('treasury_transaction.table.credit')}
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  {tSettings('treasury_transaction.table.balance')}
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  {tSettings('treasury_transaction.table.reason')}
                </th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  {tCommon('commands.actions')}
                </th>
              </tr>
            </thead>

            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                      <Spinner />
                      {tCommon('table.loading')}
                    </div>
                  </td>
                </tr>
              ) : transactions.length ? (
                transactions.map((transaction, index) => {
                  const isDebit = transaction.direction === TREASURY_MOVEMENT_DIRECTION.OUT;
                  const isCredit = transaction.direction === TREASURY_MOVEMENT_DIRECTION.IN;
                  const amount = transaction.amount ?? 0;
                  const currency = transaction.currency || transaction.account?.currency;
                  const balance = runningBalances[index] ?? 0;
                  const hasAttachments = getAttachmentCount(transaction) > 0;
                  const kindKey = getKindTranslationKey(transaction.kind);

                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-zinc-200 last:border-b-0 hover:bg-zinc-50/50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {formatReference(transaction)}
                        </div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500">
                          {formatDate(transaction, locale)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                        {transaction.account?.name || '-'}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {isDebit ? (
                          <span className="font-semibold text-emerald-600">
                            {formatAmount(amount, locale, currency)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {isCredit ? (
                          <span className="font-semibold text-red-500">
                            {formatAmount(amount, locale, currency)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <span
                          className={cn(
                            'font-semibold',
                            balance >= 0 ? 'text-emerald-600' : 'text-red-500'
                          )}
                        >
                          {formatAmount(Math.abs(balance), locale, currency)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                          {transaction.notes || transaction.label || '-'}
                          {kindKey ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {tSettings(`treasury_transaction.kinds.${kindKey}`)}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 w-8 rounded-md p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            title={tSettings('treasury_transaction.actions.view')}
                            aria-label={tSettings('treasury_transaction.actions.view')}
                            onClick={() => router.push(`/treasury/transactions/${transaction.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 w-8 rounded-md p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            title={tSettings('treasury_transaction.actions.view_receipt')}
                            aria-label={tSettings('treasury_transaction.actions.view_receipt')}
                            onClick={() => {
                              setReceiptTransaction(transaction);
                              setReceiptOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {hasAttachments ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 w-8 rounded-md p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                              title={tSettings('treasury_transaction.actions.view_attachments')}
                              aria-label={tSettings('treasury_transaction.actions.view_attachments')}
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 w-8 rounded-md p-0 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-400"
                            title={tSettings('treasury_transaction.actions.delete')}
                            aria-label={tSettings('treasury_transaction.actions.delete')}
                            onClick={() => {
                              setTransactionToDelete(transaction);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 rounded-md p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onClick={() => router.push(`/treasury/transactions/${transaction.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {tSettings('treasury_transaction.actions.view')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setReceiptTransaction(transaction);
                                  setReceiptOpen(true);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {tSettings('treasury_transaction.actions.view_receipt')}
                              </DropdownMenuItem>
                              {hasAttachments ? (
                                <DropdownMenuItem>
                                  <Paperclip className="mr-2 h-4 w-4" />
                                  {tSettings('treasury_transaction.actions.view_attachments')}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 dark:focus:bg-red-950 dark:focus:text-red-400"
                                onClick={() => {
                                  setTransactionToDelete(transaction);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {tSettings('treasury_transaction.actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {tSettings('treasury_transaction.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 flex-col gap-4 border-t border-zinc-200 px-4 py-4 text-sm dark:border-zinc-700 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="text-zinc-700 dark:text-zinc-300">
              {tSettings('treasury_transaction.pagination.rows')}
            </span>
            <Select
              value={size.toString()}
              onValueChange={(value) => {
                setPage(1);
                setSize(Number(value));
              }}
            >
              <SelectTrigger className="h-9 w-[72px] rounded-sm border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 md:ml-10">
            {tSettings('treasury_transaction.pagination.page', {
              page: currentPage,
              total: totalPageCount
            })}
          </span>

          <span className="text-sm text-zinc-500 dark:text-zinc-400 md:ml-8">
            {tSettings('treasury_transaction.pagination.range', {
              start: rangeStart,
              end: rangeEnd,
              total: totalItems
            })}
          </span>

          <div className="flex items-center gap-2 md:ml-auto">
            <Button
              type="button"
              variant="outline"
              className="h-8 w-8 rounded-sm border-zinc-200 p-0 dark:border-zinc-700"
              onClick={() => setPage(page - 1)}
              disabled={!transactionsResp?.meta.hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-8 w-8 rounded-sm border-zinc-200 p-0 dark:border-zinc-700"
              onClick={() => setPage(page + 1)}
              disabled={!transactionsResp?.meta.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <TransactionReceiptDialog
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setReceiptTransaction(null);
        }}
        transaction={receiptTransaction}
        companyName={companyName}
      />

      <TransactionDeleteDialog
        open={Boolean(transactionToDelete)}
        reference={transactionToDelete ? formatReference(transactionToDelete) : undefined}
        isPending={isDeletePending}
        onClose={() => {
          if (!isDeletePending) {
            setTransactionToDelete(null);
          }
        }}
        onConfirm={() => {
          if (transactionToDelete?.id) {
            deleteTransaction(transactionToDelete.id);
          }
        }}
      />
    </div>
  );
};

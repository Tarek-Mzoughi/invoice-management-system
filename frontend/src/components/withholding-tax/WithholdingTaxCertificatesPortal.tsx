import React from 'react';
import { format, parseISO, type Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Landmark,
  Loader2,
  MoreHorizontal,
  Printer,
  ReceiptText,
  Search,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { useDebounce } from '@/hooks/other/useDebounce';
import { ACTIVITY_TYPE, Firm, Payment } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/lib/utils';
import { getPaymentEditPath } from '@/components/payment/utils/payment-navigation';
import { PaymentActionIconButton } from '@/components/payment/list/PaymentActionIconButton';
import { usePaymentReceiptPdf } from '@/components/payment/hooks/usePaymentReceiptPdf';
import { useWithholdingTaxCertificatePdf } from './useWithholdingTaxCertificatePdf';

const ALL_PARTNERS_VALUE = '__all__';
const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface WithholdingTaxCertificatesPortalProps {
  activityType: ACTIVITY_TYPE;
  partnerLabel: string;
  partnerPlaceholder: string;
  showExportTej?: boolean;
  subtitle: string;
  title: string;
}

interface DateFilterFieldProps {
  label: string;
  locale: Locale;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

const panelClassName =
  'rounded-md border border-zinc-200 bg-white shadow-sm shadow-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none';
const fieldClassName =
  'h-9 rounded-sm border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950';
const labelClassName = 'text-sm font-medium text-zinc-800 dark:text-zinc-200';
const mutedTextClassName = 'text-zinc-500 dark:text-zinc-400';

type PaymentInvoiceEntry = NonNullable<Payment['invoices']>[number];

const getCertificateReference = (payment: Payment) => {
  const date = payment.taxWithholdingDate || payment.date;
  const parsedDate = date ? new Date(date) : null;
  const year =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.getFullYear()
      : new Date().getFullYear();
  return `RSC-${year}-${String(payment.id || 0).padStart(5, '0')}`;
};

const getPaymentInvoiceReference = (payment: Payment) => {
  const entries = payment.invoices || [];
  if (!entries.length) return '-';
  if (entries.length > 1) return `${entries.length} documents`;

  return getInvoiceEntryReference(entries[0], payment.activityType);
};

const getInvoiceEntryReference = (
  entry?: PaymentInvoiceEntry,
  activityType?: ACTIVITY_TYPE
) => {
  const invoice = entry?.invoice;
  return (
    (activityType === ACTIVITY_TYPE.BUYING
      ? invoice?.reference || invoice?.sequential
      : invoice?.sequential) ||
    invoice?.reference ||
    `#${invoice?.id || entry?.invoiceId || '-'}`
  );
};

const getInvoiceEntryId = (entry?: PaymentInvoiceEntry) =>
  entry?.invoice?.id || entry?.invoiceId;

const getInvoicePreviewFilename = (
  entry: PaymentInvoiceEntry,
  activityType?: ACTIVITY_TYPE
) => {
  const reference = getInvoiceEntryReference(entry, activityType)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${reference || getInvoiceEntryId(entry) || 'document'}.pdf`;
};

const formatAmount = (
  amount: number | undefined,
  digitAfterComma: number | undefined,
  symbol: string | undefined,
  localeCode: string
) => {
  const digits = digitAfterComma ?? 3;
  const value = Number(amount || 0).toLocaleString(localeCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  return `${value} ${symbol || ''}`.trim();
};

function DateFilterField({ label, locale, onChange, placeholder, value }: DateFilterFieldProps) {
  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-2">
      <p className={labelClassName}>{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-3 px-3 text-left text-sm transition hover:border-zinc-300 dark:hover:border-zinc-700',
              fieldClassName,
              !value ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-300'
            )}
          >
            <Calendar className={cn('h-4 w-4', mutedTextClassName)} />
            <span className="truncate">
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale }) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker
            locale={locale}
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function WithholdingTaxCertificatesPortal({
  activityType,
  partnerLabel,
  partnerPlaceholder,
  showExportTej,
  subtitle,
  title
}: WithholdingTaxCertificatesPortalProps) {
  const router = useRouter();
  const { t: tCommon, i18n } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { setRoutes, clearRoutes } = useBreadcrumb();
  const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();
  const locale = i18n.language === 'fr' ? fr : enUS;
  const numberLocale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const isBuying = activityType === ACTIVITY_TYPE.BUYING;
  const partnerEntityType = isBuying ? 'suppliers' : 'clients';
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(20);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [partnerId, setPartnerId] = React.useState(ALL_PARTNERS_VALUE);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [documentPreviewOpen, setDocumentPreviewOpen] = React.useState(false);
  const [documentPreviewBlob, setDocumentPreviewBlob] = React.useState<Blob | null>(null);
  const [documentPreviewFilename, setDocumentPreviewFilename] =
    React.useState('document-preview.pdf');
  const [paymentPendingWithholdingRemoval, setPaymentPendingWithholdingRemoval] =
    React.useState<Payment | null>(null);
  const { value: debouncedSearchTerm } = useDebounce(searchTerm, 400);
  const certificatePdf = useWithholdingTaxCertificatePdf();
  const receiptPdf = usePaymentReceiptPdf();

  React.useEffect(() => {
    setIntro?.(title, subtitle);
    setRoutes?.([
      { title: tCommon('menu.withholding'), href: isBuying ? '/withholding-tax/purchases' : '/withholding-tax/sales' },
      { title: isBuying ? tCommon('submenu.purchase_other_withholding') : tCommon('submenu.sales_withholding') }
    ]);
    if (showExportTej) {
      setFloating?.(
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-sm px-4 shadow-sm"
          onClick={() => toast.info(tInvoicing('withholding_tax.export_tej_planned'))}
        >
          <Landmark className="h-4 w-4" />
          {tInvoicing('withholding_tax.export_tej')}
        </Button>
      );
    } else {
      clearFloating?.();
    }

    return () => {
      clearIntro?.();
      clearRoutes?.();
      clearFloating?.();
    };
  }, [
    clearFloating,
    clearIntro,
    clearRoutes,
    isBuying,
    setFloating,
    setIntro,
    setRoutes,
    showExportTej,
    subtitle,
    tCommon,
    tInvoicing,
    title
  ]);

  React.useEffect(() => {
    setPage(1);
  }, [activityType, debouncedSearchTerm, endDate, partnerId, size, startDate]);

  const { data: partnersResp } = useQuery({
    queryKey: ['withholding-tax-partners', partnerEntityType],
    queryFn: () => api.firm.findChoices(['currency'], partnerEntityType)
  });

  const {
    data: paymentsResp,
    error,
    isPending,
    refetch
  } = useQuery({
    queryKey: [
      'withholding-tax-certificates',
      activityType,
      page,
      size,
      debouncedSearchTerm,
      partnerId,
      startDate,
      endDate
    ],
    queryFn: () =>
      api.payment.findPaginated(
        page,
        size,
        'DESC',
        'taxWithholdingDate',
        debouncedSearchTerm,
        ['firm', 'currency', 'taxWithholding', 'invoices', 'invoices.invoice', 'invoices.invoice.currency'],
        partnerId === ALL_PARTNERS_VALUE ? undefined : Number(partnerId),
        undefined,
        {
          activityType,
          taxWithholdingEndDate: endDate || undefined,
          taxWithholdingStartDate: startDate || undefined,
          withholdingOnly: true
        }
      )
  });

  const documentPreviewMutation = useMutation({
    mutationFn: (entry: PaymentInvoiceEntry) => {
      const invoiceId = getInvoiceEntryId(entry);
      if (!invoiceId) throw new Error('Invoice id is required');
      return api.invoice.preview(invoiceId, 'template1');
    },
    onMutate: (entry) => {
      setDocumentPreviewFilename(getInvoicePreviewFilename(entry, activityType));
      setDocumentPreviewBlob(null);
      setDocumentPreviewOpen(true);
    },
    onSuccess: (blob) => {
      setDocumentPreviewBlob(blob);
    },
    onError: (previewError) => {
      setDocumentPreviewOpen(false);
      toast.error(
        getErrorMessage(
          'invoicing',
          previewError,
          tInvoicing('withholding_tax.document_preview_failure')
        )
      );
    }
  });

  const removeWithholdingMutation = useMutation({
    mutationFn: (payment: Payment) => {
      if (!payment.id) throw new Error('Payment id is required');
      return api.payment.removeWithholding(payment.id);
    },
    onSuccess: async () => {
      toast.success(tInvoicing('withholding_tax.delete_success'));
      setPaymentPendingWithholdingRemoval(null);
      await refetch();
    },
    onError: (removeError) => {
      toast.error(
        getErrorMessage('invoicing', removeError, tInvoicing('withholding_tax.delete_failure'))
      );
    }
  });

  const payments = paymentsResp?.data || [];
  const totalPageCount = paymentsResp?.meta.pageCount || 0;
  const totalResultCount = paymentsResp?.meta.itemCount || 0;
  const partners = (partnersResp || []) as Partial<Firm>[];

  const renderDocumentReference = (payment: Payment) => {
    const entries = payment.invoices || [];

    if (!entries.length) {
      return <span>{getPaymentInvoiceReference(payment)}</span>;
    }

    if (entries.length === 1) {
      return (
        <button
          type="button"
          className="text-left font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
          onClick={() => documentPreviewMutation.mutate(entries[0])}
        >
          {getInvoiceEntryReference(entries[0], payment.activityType)}
        </button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="text-left font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
          >
            {tInvoicing('withholding_tax.multiple_documents', { count: entries.length })}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {entries.map((entry) => (
            <DropdownMenuItem
              key={entry.id || `${entry.paymentId}-${entry.invoiceId}`}
              onClick={() => documentPreviewMutation.mutate(entry)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {getInvoiceEntryReference(entry, payment.activityType)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-5 lg:px-10">
      <div className={cn(panelClassName, 'shrink-0 p-4')}>
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(220px,280px)_160px_160px]">
          <div className="space-y-2">
            <p className={labelClassName}>{tCommon('filters.search')}</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                className={cn(fieldClassName, 'pl-9')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={tInvoicing('withholding_tax.search_placeholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className={labelClassName}>{partnerLabel}</p>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={partnerPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PARTNERS_VALUE}>{tCommon('filters.all')}</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={String(partner.id)}>
                    {partner.name || `#${partner.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateFilterField
            label={tInvoicing('withholding_tax.from')}
            locale={locale}
            onChange={setStartDate}
            placeholder={tCommon('filters.select_date')}
            value={startDate}
          />
          <DateFilterField
            label={tInvoicing('withholding_tax.to')}
            locale={locale}
            onChange={setEndDate}
            placeholder={tCommon('filters.select_date')}
            value={endDate}
          />
        </div>
      </div>

      <div className={cn(panelClassName, 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900">
              <TableRow className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <TableHead>{tInvoicing('withholding_tax.columns.document')}</TableHead>
                <TableHead>{partnerLabel}</TableHead>
                <TableHead>{tInvoicing('withholding_tax.columns.date')}</TableHead>
                <TableHead className="text-right">{tInvoicing('withholding_tax.columns.amount')}</TableHead>
                <TableHead className="text-right">{tInvoicing('withholding_tax.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-b [&_tr]:border-zinc-200 [&_tr:last-child]:border-b dark:[&_tr]:border-zinc-800">
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-72 text-center">
                    <Spinner className="mx-auto" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-72 text-center text-sm text-red-500">
                    {tInvoicing('withholding_tax.load_error')}
                    <Button variant="outline" size="sm" className="ml-3" onClick={() => refetch()}>
                      {tInvoicing('withholding_tax.retry')}
                    </Button>
                  </TableCell>
                </TableRow>
              ) : payments.length ? (
                payments.map((payment) => {
                  const paymentDate = payment.taxWithholdingDate || payment.date;
                  const invoiceEntries = payment.invoices || [];
                  const hasSingleInvoice = invoiceEntries.length === 1;
                  const isRemovingThisPayment =
                    removeWithholdingMutation.isPending &&
                    paymentPendingWithholdingRemoval?.id === payment.id;
                  const canRemoveWithholding =
                    Number(payment.id || 0) > 0 && Number(payment.taxWithholdingAmount || 0) > 0;

                  return (
                    <TableRow
                      key={payment.id}
                      className="border-b border-zinc-200 bg-white hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/60"
                    >
                      <TableCell className="py-4 font-medium text-zinc-900 dark:text-zinc-50">
                        <div className="flex flex-col gap-1">
                          {renderDocumentReference(payment)}
                          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                            {getCertificateReference(payment)} · {payment.reference || `PAY-${payment.id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">{payment.firm?.name || '-'}</TableCell>
                      <TableCell className="py-4">
                        {paymentDate ? format(new Date(paymentDate), 'dd/MM/yyyy', { locale }) : '-'}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="inline-flex rounded-sm bg-emerald-50 px-2 py-1 text-sm font-semibold tabular-nums text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {formatAmount(
                            payment.taxWithholdingAmount,
                            payment.currency?.digitAfterComma,
                            payment.currency?.symbol || payment.currency?.code,
                            numberLocale
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <PaymentActionIconButton
                            label={tInvoicing('withholding_tax.actions.view_certificate')}
                            disabled={certificatePdf.isActionPending}
                            onClick={() => certificatePdf.previewCertificate(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </PaymentActionIconButton>
                          <PaymentActionIconButton
                            label={tInvoicing('withholding_tax.actions.delete_withholding')}
                            disabled={!canRemoveWithholding || isRemovingThisPayment}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                            onClick={() => setPaymentPendingWithholdingRemoval(payment)}
                          >
                            {isRemovingThisPayment ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </PaymentActionIconButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{tInvoicing('withholding_tax.columns.actions')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => payment.id && router.push(getPaymentEditPath(payment.id))}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {tInvoicing('withholding_tax.actions.view_payment')}
                              </DropdownMenuItem>
                              {hasSingleInvoice ? (
                                <DropdownMenuItem
                                  onClick={() => documentPreviewMutation.mutate(invoiceEntries[0])}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  {tInvoicing('withholding_tax.actions.view_invoice')}
                                </DropdownMenuItem>
                              ) : invoiceEntries.length > 1 ? (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <FileText className="mr-2 h-4 w-4" />
                                    {tInvoicing('withholding_tax.actions.view_invoice')}
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-56">
                                    {invoiceEntries.map((entry) => (
                                      <DropdownMenuItem
                                        key={entry.id || `${entry.paymentId}-${entry.invoiceId}`}
                                        onClick={() => documentPreviewMutation.mutate(entry)}
                                      >
                                        {getInvoiceEntryReference(entry, payment.activityType)}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              ) : null}
                              <DropdownMenuItem onClick={() => receiptPdf.previewReceipt(payment)}>
                                <ReceiptText className="mr-2 h-4 w-4" />
                                {tInvoicing('withholding_tax.actions.view_receipt')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => certificatePdf.downloadCertificate(payment)}>
                                <Download className="mr-2 h-4 w-4" />
                                {tInvoicing('withholding_tax.actions.download_certificate')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => certificatePdf.printCertificate(payment)}>
                                <Printer className="mr-2 h-4 w-4" />
                                {tInvoicing('withholding_tax.actions.print_certificate')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-72 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {tInvoicing('withholding_tax.empty_state')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span>{tInvoicing('withholding_tax.rows')}</span>
          <Select value={String(size)} onValueChange={(value) => setSize(Number(value))}>
            <SelectTrigger className="h-9 w-[72px] rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:ml-8">
          {tInvoicing('withholding_tax.page_count', {
            page,
            total: totalPageCount
          })}
        </div>
        <div className="text-zinc-500 dark:text-zinc-400 md:ml-8">
          {totalResultCount
            ? tInvoicing('withholding_tax.result_count', { count: totalResultCount })
            : tInvoicing('withholding_tax.no_result')}
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-sm"
            disabled={totalPageCount === 0 || page >= totalPageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DocumentPreviewDialog
        open={certificatePdf.previewOpen}
        loading={certificatePdf.isPreviewPending}
        previewBlob={certificatePdf.previewBlob}
        filename={certificatePdf.previewFilename}
        title={certificatePdf.previewTitle}
        closeLabel={tCommon('commands.close')}
        downloadLabel={tInvoicing('withholding_tax.actions.download_certificate')}
        printLabel={tInvoicing('withholding_tax.actions.print_certificate')}
        onClose={certificatePdf.closePreview}
      />
      <DocumentPreviewDialog
        open={documentPreviewOpen}
        loading={documentPreviewMutation.isPending}
        previewBlob={documentPreviewBlob}
        filename={documentPreviewFilename}
        title={tInvoicing('withholding_tax.document_preview_title')}
        onClose={() => {
          setDocumentPreviewOpen(false);
          setDocumentPreviewBlob(null);
        }}
      />
      <DocumentPreviewDialog
        open={receiptPdf.previewOpen}
        loading={receiptPdf.isPreviewPending}
        previewBlob={receiptPdf.previewBlob}
        filename={receiptPdf.previewFilename}
        title={tInvoicing('payment.receipt.title')}
        closeLabel={tCommon('commands.close')}
        downloadLabel={tInvoicing('payment.receipt.download_full')}
        printLabel={tInvoicing('payment.receipt.print')}
        onClose={receiptPdf.closePreview}
      />
      <Dialog
        open={!!paymentPendingWithholdingRemoval}
        onOpenChange={(open) => {
          if (!open && !removeWithholdingMutation.isPending) {
            setPaymentPendingWithholdingRemoval(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[520px] gap-0 rounded-md p-0">
          <DialogHeader className="px-6 py-5 text-left">
            <DialogTitle>{tInvoicing('withholding_tax.delete_confirm_title')}</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 leading-6">
              {tInvoicing('withholding_tax.delete_confirm_description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              disabled={removeWithholdingMutation.isPending}
              onClick={() => setPaymentPendingWithholdingRemoval(null)}
            >
              {tInvoicing('withholding_tax.delete_cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removeWithholdingMutation.isPending}
              onClick={() => {
                if (paymentPendingWithholdingRemoval) {
                  removeWithholdingMutation.mutate(paymentPendingWithholdingRemoval);
                }
              }}
            >
              {removeWithholdingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {tInvoicing('withholding_tax.delete_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

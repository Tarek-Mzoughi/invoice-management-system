import React from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { api } from '@/api';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { PERMISSIONS } from '@/features/rbac/permissions';
import { useCurrentPermissions } from '@/features/rbac/usePermissions';
import { Spinner } from '@/components/shared';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useBankAccount from '@/hooks/content/useBankAccount';
import useCabinet from '@/hooks/content/useCabinet';
import useCurrency from '@/hooks/content/useCurrency';
import useFirmChoices from '@/hooks/content/useFirmChoice';
import useTaxWithholding from '@/hooks/content/useTaxWithholding';
import { cn } from '@/lib/utils';
import {
  ACTIVITY_TYPE,
  CreatePaymentDto,
  CreditNote,
  Currency,
  Firm,
  INVOICE_STATUS,
  NEGOTIABLE_PAYMENT_MODES,
  PAYMENT_COLLECTION_STATUS,
  PAYMENT_MODE,
  Payment,
  PaymentCreditNoteEntry,
  PaymentInvoiceEntry,
  PaymentUpload,
  PaymentUploadedFile,
  UpdatePaymentDto
} from '@/types';
import { getErrorMessage } from '@/utils/errors';
import {
  convertInvoiceAmountToPaymentCurrency,
  getInvoiceRemainingAmount,
  roundPaymentAmount
} from './payment-workflow-utils';
import { PaymentWorkflowHeader } from './PaymentWorkflowHeader';
import { PaymentContextCard } from './PaymentContextCard';
import { PartnerSelectorCard } from './PartnerSelectorCard';
import { PayableDocumentsCard } from './PayableDocumentsCard';
import { PaymentDetailsCard } from './PaymentDetailsCard';
import { WithholdingTaxCard } from './WithholdingTaxCard';
import { CreditNotesCard } from './CreditNotesCard';
import { PaymentNotesAttachmentsCard } from './PaymentNotesAttachmentsCard';
import { PaymentSummaryPanel } from './PaymentSummaryPanel';
import {
  getCreditNoteAvailableAmount,
  getCreditNoteConvertedAmount,
  getCreditNoteCoverageAmount,
  isCreditNoteAvailableForPayment
} from './payment-workflow-calculations';

type PaymentWorkflowMode = 'create' | 'update';

interface PaymentWorkflowFormProps {
  activityType?: ACTIVITY_TYPE;
  className?: string;
  firmId?: string;
  listPath: string;
  mode: PaymentWorkflowMode;
  paymentId?: string;
  paymentTypeControl?: React.ReactNode;
  paymentTypeHelperText?: React.ReactNode;
}

interface PaymentFormState {
  id?: number;
  amount: number;
  collectionStatus?: PAYMENT_COLLECTION_STATUS;
  convertionRate: number;
  currency?: Currency;
  currencyId?: number;
  date?: Date;
  depositedAt?: string;
  dueDate?: Date;
  encashmentMovementId?: number;
  fee: number;
  firm?: Firm;
  firmId?: number;
  mode: PAYMENT_MODE;
  notes: string;
  originTreasuryAccountId?: number;
  paidAt?: string;
  reference: string;
  rejectedAt?: string;
  rejectionReason?: string;
  taxWithholdingAmount?: number;
  taxWithholdingDate?: Date;
  taxWithholdingId?: number;
  treasuryAccountId?: number;
  uploadedFiles: PaymentUploadedFile[];
}

const payableStatuses = [
  INVOICE_STATUS.PartiallyPaid,
  INVOICE_STATUS.PartiallySettled,
  INVOICE_STATUS.Unpaid
];

const emptyFormState: PaymentFormState = {
  amount: 0,
  collectionStatus: PAYMENT_COLLECTION_STATUS.Pending,
  convertionRate: 1,
  fee: 0,
  mode: PAYMENT_MODE.Cash,
  notes: '',
  reference: '',
  rejectionReason: '',
  uploadedFiles: []
};

const serializeDateValue = (value?: Date) => (value ? value.toISOString() : undefined);

const isNegotiableMode = (mode?: PAYMENT_MODE) =>
  NEGOTIABLE_PAYMENT_MODES.includes(mode as PAYMENT_MODE);

const isCreditNoteSettlementMode = (mode?: PAYMENT_MODE) =>
  mode === PAYMENT_MODE.CreditNoteSettlement;

const toMinorAmount = (value: number | undefined, currency?: Currency) => {
  const precision = currency?.digitAfterComma ?? 3;
  return Math.round(Number(value || 0) * 10 ** precision);
};

const fromMinorAmount = (value: number, currency?: Currency) => {
  const precision = currency?.digitAfterComma ?? 3;
  return Number((value / 10 ** precision).toFixed(precision));
};

const reduceInvoiceEntriesByAmount = (
  entries: PaymentInvoiceEntry[],
  reductionAmount: number,
  currency?: Currency
) => {
  const requestedReductionMinor = Math.max(toMinorAmount(reductionAmount, currency), 0);

  if (!requestedReductionMinor || !entries.length) return entries;

  const allocations = entries.map((entry, index) => ({
    index,
    amountMinor: Math.max(toMinorAmount(entry.amount, currency), 0)
  }));
  const affectedAllocations = allocations.filter((allocation) => allocation.amountMinor > 0);
  const totalAllocatedMinor = affectedAllocations.reduce(
    (sum, allocation) => sum + allocation.amountMinor,
    0
  );

  if (!totalAllocatedMinor) return entries;

  const reductionMinor = Math.min(requestedReductionMinor, totalAllocatedMinor);
  const reductions = new Map<number, number>();
  let appliedReductionMinor = 0;

  affectedAllocations.forEach((allocation) => {
    const proportionalReduction = Math.floor(
      (reductionMinor * allocation.amountMinor) / totalAllocatedMinor
    );
    const safeReduction = Math.min(proportionalReduction, allocation.amountMinor);
    reductions.set(allocation.index, safeReduction);
    appliedReductionMinor += safeReduction;
  });

  let remainderMinor = reductionMinor - appliedReductionMinor;
  for (let index = affectedAllocations.length - 1; index >= 0 && remainderMinor > 0; index -= 1) {
    const allocation = affectedAllocations[index];
    const currentReduction = reductions.get(allocation.index) ?? 0;
    const capacity = allocation.amountMinor - currentReduction;
    const extraReduction = Math.min(capacity, remainderMinor);
    reductions.set(allocation.index, currentReduction + extraReduction);
    remainderMinor -= extraReduction;
  }

  return entries.map((entry, index) => {
    const amountMinor = allocations[index].amountMinor;
    const reduction = reductions.get(index) ?? 0;

    return {
      ...entry,
      amount: fromMinorAmount(Math.max(amountMinor - reduction, 0), currency)
    };
  });
};

export const PaymentWorkflowForm = ({
  activityType,
  className,
  firmId,
  listPath,
  mode,
  paymentId,
  paymentTypeControl,
  paymentTypeHelperText
}: PaymentWorkflowFormProps) => {
  const router = useRouter();
  const { setRoutes } = useBreadcrumb();
  const { t: tCommon } = useTranslation('common');
  const { t: tCurrency } = useTranslation('currency');
  const { t: tContacts } = useTranslation('contacts');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { isPending: isPermissionsPending, hasPermission } = useCurrentPermissions();

  const isUpdateMode = mode === 'update';
  const hasPaymentType = !!activityType;
  const isSalesPayment = activityType === ACTIVITY_TYPE.SELLING;
  const isBuyingPayment = activityType === ACTIVITY_TYPE.BUYING;
  const firmType = hasPaymentType ? (isSalesPayment ? 'clients' : 'suppliers') : undefined;
  const invoicePathPrefix = isSalesPayment ? '/selling/invoice' : '/buying/facture-achat';
  const menuKey = hasPaymentType ? (isSalesPayment ? 'menu.selling' : 'menu.buying') : 'menu.payments';
  const backHref = firmId ? `/contacts/firm/${firmId}/?tab=payments` : listPath;
  const canCreatePayments = hasPermission(PERMISSIONS.payments.create);
  const canReadPayments = hasPermission(PERMISSIONS.payments.read);
  const canUseReadLookups = !isPermissionsPending;
  const canReadSellingDocuments = canUseReadLookups;
  const canReadBuyingDocuments = canUseReadLookups;
  const canReadClients = canUseReadLookups;
  const canReadSuppliers = canUseReadLookups;
  const canReadTreasury = hasPermission(PERMISSIONS.treasury.read);
  const canReadTaxes = hasPermission(PERMISSIONS.taxes.read);
  const canReadPartner = !hasPaymentType || (isSalesPayment ? canReadClients : canReadSuppliers);
  const canReadCurrentDocuments =
    !hasPaymentType || (isSalesPayment ? canReadSellingDocuments : canReadBuyingDocuments);
  const requiredPermissionNoticeKeys = React.useMemo(() => {
    if (isPermissionsPending) return [];

    const notices: string[] = [];

    if (isUpdateMode) {
      if (!canReadPayments) notices.push('rbac.requiresPaymentsRead');
    } else if (!canCreatePayments) {
      notices.push('rbac.requiresPaymentsCreate');
    }

    return notices;
  }, [
    canCreatePayments,
    canReadPayments,
    isPermissionsPending,
    isUpdateMode
  ]);
  const requiredReady = !isPermissionsPending && requiredPermissionNoticeKeys.length === 0;

  const [form, setForm] = React.useState<PaymentFormState>(emptyFormState);
  const [invoiceEntries, setInvoiceEntries] = React.useState<PaymentInvoiceEntry[]>([]);
  const [creditNoteEntries, setCreditNoteEntries] = React.useState<PaymentCreditNoteEntry[]>([]);
  const [documentSearch, setDocumentSearch] = React.useState('');
  const [taxWithholdingEnabled, setTaxWithholdingEnabled] = React.useState(false);

  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { cabinet, isFetchCabinetPending } = useCabinet();
  const { firms, isFetchFirmsPending } = useFirmChoices(
    ['currency', 'invoices', 'invoices.currency'],
    {
      enabled: requiredReady && hasPaymentType && canReadPartner
    },
    firmType
  );
  const {
    bankAccounts: treasuryAccounts,
    isFetchBankAccountsPending: isFetchTreasuryAccountsPending
  } = useBankAccount({
    enabled: requiredReady && canReadTreasury,
    silentForbiddenToast: true
  });
  const {
    taxWithholdings,
    isFetchTaxWithholdingsPending
  } = useTaxWithholding({
    enabled: requiredReady && canReadTaxes,
    silentForbiddenToast: true
  });
  const { data: paymentResp, isPending: isFetchPaymentPending } = useQuery({
    queryKey: ['payment', paymentId, 'workflow'],
    queryFn: () => api.payment.findOne(Number(paymentId)),
    enabled: requiredReady && isUpdateMode && !!paymentId && canReadPayments
  });
  const { data: creditNotesResp, isPending: isFetchCreditNotesPending } = useQuery({
    queryKey: ['payment-credit-notes', activityType, form.firmId],
    queryFn: () =>
      api.creditNote.findPaginated(1, 100, 'DESC', 'date', {
        activityType: activityType as ACTIVITY_TYPE,
        firmId: form.firmId,
        relations: ['currency', 'firm']
      }),
    enabled: requiredReady && hasPaymentType && canReadCurrentDocuments && !!form.firmId
  });

  const creditNotes = React.useMemo(() => creditNotesResp?.data || [], [creditNotesResp]);
  const availableCreditNotes = React.useMemo(() => {
    const byId = new Map<number, CreditNote>();

    creditNotes
      .filter((creditNote) => isCreditNoteAvailableForPayment(creditNote))
      .forEach((creditNote) => {
        if (creditNote.id) byId.set(creditNote.id, creditNote);
      });

    creditNoteEntries.forEach((entry) => {
      if (entry.creditNote?.id) byId.set(entry.creditNote.id, entry.creditNote);
    });

    return Array.from(byId.values());
  }, [creditNoteEntries, creditNotes]);
  const paymentCurrency = React.useMemo(
    () => currencies.find((currency) => currency.id === form.currencyId) || form.currency,
    [currencies, form.currency, form.currencyId]
  );
  const selectedTaxWithholding = React.useMemo(
    () => taxWithholdings.find((tax) => tax.id === form.taxWithholdingId),
    [form.taxWithholdingId, taxWithholdings]
  );
  const selectedFirm = React.useMemo(
    () => firms.find((firm) => firm.id === form.firmId) || form.firm,
    [firms, form.firm, form.firmId]
  );
  const paymentModeOptions = React.useMemo(() => Object.values(PAYMENT_MODE), []);
  const isCreditNoteSettlement = isCreditNoteSettlementMode(form.mode);
  const shouldDisableCreditNotes = isNegotiableMode(form.mode);
  const payableInvoices = React.useMemo(() => {
    if (!activityType) return [];

    const invoices = selectedFirm?.invoices || [];
    const normalizedSearch = documentSearch.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const isSameActivity = (invoice?.activityType || ACTIVITY_TYPE.SELLING) === activityType;
      const isPayable = invoice?.status ? payableStatuses.includes(invoice.status) : false;
      const hasRemaining = getInvoiceRemainingAmount(invoice) > 0;
      const searchable = [
        invoice?.sequential,
        invoice?.reference,
        invoice?.status,
        invoice?.currency?.code
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        isSameActivity &&
        isPayable &&
        hasRemaining &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      );
    });
  }, [activityType, documentSearch, selectedFirm]);

  const isLoading =
    isPermissionsPending ||
    isFetchCurrenciesPending ||
    isFetchCabinetPending ||
    (requiredReady && hasPaymentType && isFetchFirmsPending) ||
    isFetchTreasuryAccountsPending ||
    isFetchTaxWithholdingsPending ||
    (isUpdateMode && isFetchPaymentPending);

  const totalAllocated = React.useMemo(
    () => roundPaymentAmount(invoiceEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0), paymentCurrency),
    [invoiceEntries, paymentCurrency]
  );
  const creditNoteUsedAmount = React.useMemo(
    () => getCreditNoteCoverageAmount(creditNoteEntries, paymentCurrency),
    [creditNoteEntries, paymentCurrency]
  );
  const calculatedWithholdingAmount = React.useMemo(() => {
    if (!taxWithholdingEnabled || !selectedTaxWithholding?.rate) return 0;
    return roundPaymentAmount(totalAllocated * (selectedTaxWithholding.rate / 100), paymentCurrency);
  }, [paymentCurrency, selectedTaxWithholding?.rate, taxWithholdingEnabled, totalAllocated]);
  const coverageTotal = React.useMemo(
    () =>
      roundPaymentAmount(
        (form.amount || 0) + (form.fee || 0) + creditNoteUsedAmount + calculatedWithholdingAmount,
        paymentCurrency
      ),
    [calculatedWithholdingAmount, creditNoteUsedAmount, form.amount, form.fee, paymentCurrency]
  );
  const remainingAfterPayment = React.useMemo(
    () => roundPaymentAmount(totalAllocated - coverageTotal, paymentCurrency),
    [coverageTotal, paymentCurrency, totalAllocated]
  );
  const selectedInvoicesHaveInvoiceWithholding = React.useMemo(
    () => invoiceEntries.some((entry) => (entry.invoice?.taxWithholdingAmount || 0) > 0),
    [invoiceEntries]
  );

  const syncMoneyAmountFromCoverage = React.useCallback(
    (entries: PaymentInvoiceEntry[], fee = form.fee, creditEntries = creditNoteEntries) => {
      const allocated = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const creditUsed = getCreditNoteCoverageAmount(creditEntries, paymentCurrency);
      const withholding =
        taxWithholdingEnabled && selectedTaxWithholding?.rate
          ? allocated * (selectedTaxWithholding.rate / 100)
          : 0;

      return Math.max(roundPaymentAmount(allocated - fee - creditUsed - withholding, paymentCurrency), 0);
    },
    [creditNoteEntries, form.fee, paymentCurrency, selectedTaxWithholding?.rate, taxWithholdingEnabled]
  );

  const resetForm = React.useCallback(() => {
    const cabinetCurrency = cabinet?.currency;
    setForm({
      ...emptyFormState,
      currency: cabinetCurrency,
      currencyId: cabinetCurrency?.id
    });
    setInvoiceEntries([]);
    setCreditNoteEntries([]);
    setDocumentSearch('');
    setTaxWithholdingEnabled(false);
  }, [cabinet?.currency]);

  React.useEffect(() => {
    if (!taxWithholdingEnabled) return;
    setForm((current) => ({
      ...current,
      amount: isCreditNoteSettlementMode(current.mode)
        ? 0
        : syncMoneyAmountFromCoverage(invoiceEntries, current.fee)
    }));
  }, [
    invoiceEntries,
    selectedTaxWithholding?.rate,
    syncMoneyAmountFromCoverage,
    taxWithholdingEnabled
  ]);

  React.useEffect(() => {
    if (isPermissionsPending || canReadTaxes) return;

    setTaxWithholdingEnabled(false);
    setForm((current) => {
      if (
        current.taxWithholdingAmount === undefined &&
        current.taxWithholdingDate === undefined &&
        current.taxWithholdingId === undefined
      ) {
        return current;
      }

      return {
        ...current,
        taxWithholdingAmount: undefined,
        taxWithholdingDate: undefined,
        taxWithholdingId: undefined
      };
    });
  }, [canReadTaxes, isPermissionsPending]);

  React.useEffect(() => {
    if (isPermissionsPending || canReadTreasury) return;

    setForm((current) => {
      if (
        current.originTreasuryAccountId === undefined &&
        current.treasuryAccountId === undefined
      ) {
        return current;
      }

      return {
        ...current,
        originTreasuryAccountId: undefined,
        treasuryAccountId: undefined
      };
    });
  }, [canReadTreasury, isPermissionsPending]);

  React.useEffect(() => {
    setRoutes?.(
      !firmId
        ? [
            { title: tCommon(menuKey), href: hasPaymentType ? (isSalesPayment ? '/selling' : '/buying') : '/payments' },
            { title: tInvoicing('payment.plural'), href: listPath },
            {
              title: isUpdateMode
                ? `${tInvoicing('payment.singular')} N° ${paymentId}`
                : hasPaymentType
                  ? isSalesPayment
                    ? tInvoicing('payment.workflow.new_sales', {
                        defaultValue: 'Nouveau encaissement client'
                      })
                    : tInvoicing('payment.workflow.new_purchase', {
                        defaultValue: 'Nouveau paiement fournisseur'
                      })
                  : tInvoicing('payment.new')
            }
          ]
        : [
            { title: tCommon('menu.contacts'), href: '/contacts' },
            { title: tContacts('firm.plural'), href: '/contacts/firms' },
            {
              title: `${tContacts('firm.singular')} N°${firmId}`,
              href: `/contacts/firm/${firmId}?tab=entreprise`
            },
            { title: tInvoicing('payment.new') }
          ]
    );
  }, [
    firmId,
    hasPaymentType,
    isSalesPayment,
    isUpdateMode,
    listPath,
    menuKey,
    paymentId,
    setRoutes,
    tCommon,
    tContacts,
    tInvoicing
  ]);

  React.useEffect(() => {
    const cabinetCurrency = cabinet?.currency;
    if (isUpdateMode || !cabinetCurrency) return;
    setForm((current) => ({
      ...current,
      currency: current.currency || cabinetCurrency,
      currencyId: current.currencyId || cabinetCurrency.id
    }));
  }, [cabinet?.currency, isUpdateMode]);

  React.useEffect(() => {
    if (!isUpdateMode || !paymentResp?.id) return;

    const payment = paymentResp as Payment & { files?: PaymentUploadedFile[] };
    const taxWithholdingDate = payment.taxWithholdingDate
      ? new Date(payment.taxWithholdingDate)
      : payment.date
        ? new Date(payment.date)
        : undefined;

    setForm({
      id: payment.id,
      amount: payment.amount || 0,
      collectionStatus: payment.collectionStatus || PAYMENT_COLLECTION_STATUS.Pending,
      convertionRate: payment.convertionRate || 1,
      currency: payment.currency,
      currencyId: payment.currencyId,
      date: payment.date ? new Date(payment.date) : undefined,
      depositedAt: payment.depositedAt,
      dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
      encashmentMovementId: payment.encashmentMovementId,
      fee: payment.fee || 0,
      firm: payment.firm,
      firmId: payment.firmId,
      mode: payment.mode || PAYMENT_MODE.Cash,
      notes: payment.notes || '',
      originTreasuryAccountId: payment.originTreasuryAccountId,
      paidAt: payment.paidAt,
      reference: payment.reference || '',
      rejectedAt: payment.rejectedAt,
      rejectionReason: payment.rejectionReason || '',
      taxWithholdingAmount: payment.taxWithholdingAmount,
      taxWithholdingDate,
      taxWithholdingId: payment.taxWithholdingId,
      treasuryAccountId: payment.treasuryAccountId,
      uploadedFiles: payment.files || []
    });
    setTaxWithholdingEnabled(!!payment.taxWithholdingId);
    setInvoiceEntries(
      (payment.invoices || []).map((entry) => ({
        ...entry,
        amount:
          payment.currencyId && entry.invoice?.currencyId && payment.currencyId !== entry.invoice.currencyId
            ? roundPaymentAmount((entry.amount || 0) / (payment.convertionRate || 1), payment.currency)
            : entry.amount || 0
      }))
    );
    setCreditNoteEntries(
      ((payment as Payment).creditNotes || []).map((entry) => ({
        ...entry,
        amount: entry.amount || 0,
        convertedAmount: entry.convertedAmount ?? entry.amount ?? 0,
        convertedCurrencyId: entry.convertedCurrencyId ?? payment.currencyId,
        exchangeRateToPaymentCurrency: entry.exchangeRateToPaymentCurrency ?? 1,
        originalCurrencyId: entry.originalCurrencyId ?? entry.creditNote?.currencyId ?? undefined
      }))
    );
  }, [isUpdateMode, paymentResp]);

  const updateForm = <K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFirmChange = (value: string) => {
    const firm = firms.find((candidate) => candidate.id === Number(value));
    setForm((current) => ({
      ...current,
      amount: 0,
      currency: firm?.currency || cabinet?.currency,
      currencyId: firm?.currency?.id || cabinet?.currency?.id,
      firm,
      firmId: firm?.id,
      mode: isCreditNoteSettlementMode(current.mode) ? PAYMENT_MODE.Cash : current.mode,
      treasuryAccountId: current.treasuryAccountId
    }));
    setInvoiceEntries([]);
    setCreditNoteEntries([]);
    setTaxWithholdingEnabled(false);
  };

  const handleCurrencyChange = (value: string) => {
    const currency = currencies.find((candidate) => candidate.id === Number(value));
    setForm((current) => ({
      ...current,
      amount: 0,
      currency,
      currencyId: currency?.id,
      mode: isCreditNoteSettlementMode(current.mode) ? PAYMENT_MODE.Cash : current.mode
    }));
    setInvoiceEntries((current) => current.map((entry) => ({ ...entry, amount: 0 })));
    setCreditNoteEntries([]);
  };

  const handleModeChange = (value: PAYMENT_MODE) => {
    const isAvoirMode = isCreditNoteSettlementMode(value);
    const isNegotiable = isNegotiableMode(value);
    const nextCreditNoteEntries = isNegotiable ? [] : creditNoteEntries;

    if (isNegotiable) {
      setCreditNoteEntries([]);
    }

    setForm((current) => ({
      ...current,
      amount: isAvoirMode
        ? 0
        : syncMoneyAmountFromCoverage(invoiceEntries, current.fee, nextCreditNoteEntries),
      collectionStatus: isNegotiable ? PAYMENT_COLLECTION_STATUS.Pending : undefined,
      dueDate: isNegotiable ? current.dueDate : undefined,
      mode: value,
      originTreasuryAccountId: isAvoirMode ? undefined : current.originTreasuryAccountId,
      treasuryAccountId: isAvoirMode ? undefined : current.treasuryAccountId
    }));
  };

  const toggleInvoice = (invoiceId?: number) => {
    if (!invoiceId) return;
    const existingEntry = invoiceEntries.find((entry) => entry.invoice?.id === invoiceId);
    const invoice = payableInvoices.find((candidate) => candidate.id === invoiceId);

    if (existingEntry) {
      const nextEntries = invoiceEntries.filter((entry) => entry.invoice?.id !== invoiceId);
      setInvoiceEntries(nextEntries);
      setForm((current) => ({
        ...current,
        amount: isCreditNoteSettlementMode(current.mode) ? 0 : syncMoneyAmountFromCoverage(nextEntries)
      }));
      return;
    }

    if (!invoice) return;

    const remainingAmount = convertInvoiceAmountToPaymentCurrency(
      getInvoiceRemainingAmount(invoice),
      invoice,
      paymentCurrency,
      form.convertionRate
    );
    const nextEntries = [
      ...invoiceEntries,
      {
        invoice,
        invoiceId: invoice.id,
        amount: roundPaymentAmount(remainingAmount, paymentCurrency)
      }
    ];
    setInvoiceEntries(nextEntries);
    setForm((current) => ({
      ...current,
      amount: isCreditNoteSettlementMode(current.mode) ? 0 : syncMoneyAmountFromCoverage(nextEntries)
    }));
  };

  const updateInvoiceEntryAmount = (invoiceId: number | undefined, value: number) => {
    if (!invoiceId) return;

    const nextEntries = invoiceEntries.map((entry) => {
      if (entry.invoice?.id !== invoiceId) return entry;
      const remainingAmount = convertInvoiceAmountToPaymentCurrency(
        getInvoiceRemainingAmount(entry.invoice),
        entry.invoice,
        paymentCurrency,
        form.convertionRate
      );
      return {
        ...entry,
        amount: roundPaymentAmount(Math.min(Math.max(value, 0), remainingAmount), paymentCurrency)
      };
    });

    setInvoiceEntries(nextEntries);
  };

  const handlePaymentAmountChange = (value: number) => {
    const nextAmount = Math.max(value, 0);
    setForm((current) => ({
      ...current,
      amount: nextAmount,
      mode:
        nextAmount > 0 && isCreditNoteSettlementMode(current.mode)
          ? PAYMENT_MODE.Cash
          : current.mode
    }));

    if (invoiceEntries.length === 1) {
      const onlyEntry = invoiceEntries[0];
      updateInvoiceEntryAmount(
        onlyEntry.invoice?.id,
        nextAmount + (form.fee || 0) + creditNoteUsedAmount + calculatedWithholdingAmount
      );
    }
  };

  const handleFeeChange = (value: number) => {
    const nextFee = Math.max(Number(value || 0), 0);
    setForm((current) => {
      const nextAmount = syncMoneyAmountFromCoverage(invoiceEntries, nextFee);
      const nextMode =
        nextAmount <= 0 && creditNoteUsedAmount > 0 && !isNegotiableMode(current.mode)
          ? PAYMENT_MODE.CreditNoteSettlement
          : nextAmount > 0 && isCreditNoteSettlementMode(current.mode)
            ? PAYMENT_MODE.Cash
            : current.mode;

      return {
        ...current,
        amount: isCreditNoteSettlementMode(nextMode) ? 0 : nextAmount,
        fee: nextFee,
        mode: nextMode,
        treasuryAccountId: isCreditNoteSettlementMode(nextMode) ? undefined : current.treasuryAccountId
      };
    });
  };

  const handleTaxWithholdingEnabledChange = (enabled: boolean) => {
    if (enabled && !canReadTaxes) return;

    setTaxWithholdingEnabled(enabled);

    const withholdingToRemove = calculatedWithholdingAmount || form.taxWithholdingAmount || 0;
    const adjustedInvoiceEntries = enabled
      ? invoiceEntries
      : reduceInvoiceEntriesByAmount(invoiceEntries, withholdingToRemove, paymentCurrency);

    if (!enabled) {
      setInvoiceEntries(adjustedInvoiceEntries);
    }

    setForm((current) => {
      if (enabled) {
        return {
          ...current,
          taxWithholdingDate: current.taxWithholdingDate || current.date || new Date()
        };
      }

      const nextMode =
        current.amount <= 0 && creditNoteUsedAmount > 0 && !isNegotiableMode(current.mode)
          ? PAYMENT_MODE.CreditNoteSettlement
          : current.amount > 0 && isCreditNoteSettlementMode(current.mode)
            ? PAYMENT_MODE.Cash
            : current.mode;

      return {
        ...current,
        amount: isCreditNoteSettlementMode(nextMode) ? 0 : current.amount,
        mode: nextMode,
        taxWithholdingAmount: undefined,
        taxWithholdingDate: undefined,
        taxWithholdingId: undefined,
        treasuryAccountId: isCreditNoteSettlementMode(nextMode) ? undefined : current.treasuryAccountId
      };
    });
  };

  const applyCreditNoteEntries = (nextEntries: PaymentCreditNoteEntry[]) => {
    const nextAmount = syncMoneyAmountFromCoverage(invoiceEntries, form.fee, nextEntries);
    const nextCreditCoverage = getCreditNoteCoverageAmount(nextEntries, paymentCurrency);

    setCreditNoteEntries(nextEntries);
    setForm((current) => {
      const nextMode =
        nextAmount <= 0 && nextCreditCoverage > 0 && !isNegotiableMode(current.mode)
          ? PAYMENT_MODE.CreditNoteSettlement
          : nextAmount > 0 && isCreditNoteSettlementMode(current.mode)
            ? PAYMENT_MODE.Cash
            : current.mode;

      return {
        ...current,
        amount: isCreditNoteSettlementMode(nextMode) ? 0 : nextAmount,
        mode: nextMode,
        treasuryAccountId: isCreditNoteSettlementMode(nextMode) ? undefined : current.treasuryAccountId
      };
    });
  };

  const updateCreditNoteEntry = (creditNote: CreditNote, value: number) => {
    if (shouldDisableCreditNotes) return;
    const availableAmount = getCreditNoteAvailableAmount(creditNote);
    const safeAmount = roundPaymentAmount(Math.min(Math.max(value, 0), availableAmount), creditNote.currency);
    const withoutCurrent = creditNoteEntries.filter((entry) => entry.creditNoteId !== creditNote.id);
    const isCrossCurrency = !!paymentCurrency?.id && creditNote.currencyId !== paymentCurrency.id;
    const currentEntry = creditNoteEntries.find((entry) => entry.creditNoteId === creditNote.id);
    const rate = isCrossCurrency ? Number(currentEntry?.exchangeRateToPaymentCurrency || 0) : 1;
    const convertedAmount = getCreditNoteConvertedAmount(
      safeAmount,
      creditNote,
      paymentCurrency,
      rate
    );
    const nextEntries =
      safeAmount > 0
        ? [
            ...withoutCurrent,
            {
              creditNote,
              creditNoteId: creditNote.id,
              amount: safeAmount,
              convertedAmount,
              convertedCurrencyId: paymentCurrency?.id,
              convertedCurrency: paymentCurrency,
              exchangeRateToPaymentCurrency: rate,
              originalCurrencyId: creditNote.currencyId ?? undefined,
              originalCurrency: creditNote.currency
            }
          ]
        : withoutCurrent;

    applyCreditNoteEntries(nextEntries);
  };

  const updateCreditNoteRate = (creditNote: CreditNote, value: number) => {
    if (shouldDisableCreditNotes) return;
    const nextRate = Math.max(Number(value || 0), 0);
    const nextEntries = creditNoteEntries.map((entry) => {
      if (entry.creditNoteId !== creditNote.id) return entry;
      return {
        ...entry,
        exchangeRateToPaymentCurrency: nextRate,
        convertedAmount: getCreditNoteConvertedAmount(
          entry.amount || 0,
          creditNote,
          paymentCurrency,
          nextRate
        ),
        convertedCurrencyId: paymentCurrency?.id,
        convertedCurrency: paymentCurrency,
        originalCurrencyId: creditNote.currencyId ?? undefined,
        originalCurrency: creditNote.currency
      };
    });

    applyCreditNoteEntries(nextEntries);
  };

  const handleFilesChange = (files: File[]) => {
    setForm((current) => {
      if (files.length > current.uploadedFiles.length) {
        const newFiles = files.filter(
          (file) => !current.uploadedFiles.some((uploadedFile) => uploadedFile.file === file)
        );
        return {
          ...current,
          uploadedFiles: [...current.uploadedFiles, ...newFiles.map((file) => ({ file }))]
        };
      }

      return {
        ...current,
        uploadedFiles: current.uploadedFiles.filter((uploadedFile) =>
          files.some((file) => file === uploadedFile.file)
        )
      };
    });
  };

  const buildInvoicePayload = () =>
    invoiceEntries
      .filter((entry) => (entry.invoice?.id || entry.invoiceId || 0) > 0 && Number(entry.amount || 0) > 0)
      .map((entry) => ({
        invoiceId: entry.invoice?.id || entry.invoiceId,
        amount: Number(entry.amount || 0)
      }));

  const buildCreditNotePayload = () =>
    creditNoteEntries
      .filter((entry) => (entry.creditNote?.id || entry.creditNoteId || 0) > 0 && Number(entry.amount || 0) > 0)
      .map((entry) => ({
        creditNoteId: entry.creditNote?.id || entry.creditNoteId,
        amount: Number(entry.amount || 0),
        originalCurrencyId: entry.originalCurrencyId ?? entry.creditNote?.currencyId ?? undefined,
        exchangeRateToPaymentCurrency: Number(entry.exchangeRateToPaymentCurrency || 1),
        convertedAmount: Number(entry.convertedAmount ?? entry.amount ?? 0),
        convertedCurrencyId: entry.convertedCurrencyId || form.currencyId
      }));

  const basePaymentPayload = () => {
    const shouldSendTreasuryAccounts = canReadTreasury && !isCreditNoteSettlement;
    const shouldSendTaxWithholding = canReadTaxes && taxWithholdingEnabled;

    return {
      activityType,
      amount: form.amount,
      collectionStatus: form.collectionStatus,
      convertionRate: form.convertionRate || 1,
      currencyId: form.currencyId,
      date: serializeDateValue(form.date),
      depositedAt: form.depositedAt,
      dueDate: serializeDateValue(form.dueDate),
      encashmentMovementId: form.encashmentMovementId,
      fee: form.fee,
      firmId: form.firmId,
      mode: form.mode,
      notes: form.notes,
      originTreasuryAccountId: shouldSendTreasuryAccounts
        ? form.originTreasuryAccountId
        : undefined,
      paidAt: form.paidAt,
      reference: form.reference?.trim() || undefined,
      rejectedAt: form.rejectedAt,
      rejectionReason: form.rejectionReason?.trim() || undefined,
      taxWithholdingAmount: shouldSendTaxWithholding ? calculatedWithholdingAmount : undefined,
      taxWithholdingDate: shouldSendTaxWithholding
        ? serializeDateValue(form.taxWithholdingDate || form.date)
        : undefined,
      taxWithholdingId: shouldSendTaxWithholding ? form.taxWithholdingId : undefined,
      treasuryAccountId: shouldSendTreasuryAccounts ? form.treasuryAccountId : undefined,
      creditNotes: buildCreditNotePayload(),
      invoices: buildInvoicePayload()
    };
  };

  const { mutate: createPayment, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { payment: CreatePaymentDto; files: File[] }) =>
      api.payment.create(data.payment, data.files),
    onSuccess: () => {
      toast.success(tInvoicing('payment.action_create_success'));
      router.push(backHref);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, tInvoicing('payment.action_create_failure')));
    }
  });

  const { mutate: updatePayment, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: { payment: UpdatePaymentDto; files: File[] }) =>
      api.payment.update(data.payment, data.files),
    onSuccess: () => {
      toast.success(tInvoicing('payment.action_update_success'));
      router.push(backHref);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, tInvoicing('payment.action_update_failure')));
    }
  });

  const handleSubmit = () => {
    if (!requiredReady) {
      toast.error(tCommon(requiredPermissionNoticeKeys[0] || 'rbac.sectionUnavailable'));
      return;
    }

    if (!activityType) {
      toast.error(
        tInvoicing('payment.errors.type_required', {
          defaultValue: 'Veuillez choisir un type de paiement.'
        })
      );
      return;
    }

    const payment = basePaymentPayload();
    const validation = api.payment.validate(payment, totalAllocated, coverageTotal);
    const isTreasuryValidationBypassed =
      !canReadTreasury && validation.message === 'payment.errors.treasury_account_required';

    if (taxWithholdingEnabled && selectedInvoicesHaveInvoiceWithholding) {
      toast.error(
        tInvoicing('payment.errors.withholding_double_apply', {
          defaultValue:
            'Retenue a la source already exists on a selected invoice. Remove it before applying payment-level withholding.'
        })
      );
      return;
    }

    if (canReadTaxes && taxWithholdingEnabled && !form.taxWithholdingId) {
      toast.error(
        tInvoicing('payment.errors.tax_withholding_required', {
          defaultValue: 'Veuillez choisir un type de retenue a la source.'
        })
      );
      return;
    }

    if (validation.message && !isTreasuryValidationBypassed) {
      toast.error(tInvoicing(validation.message));
      return;
    }

    const newFiles = form.uploadedFiles.filter((uploadedFile) => !uploadedFile.upload).map((u) => u.file);

    if (isUpdateMode) {
      updatePayment({
        payment: {
          ...payment,
          id: form.id,
          uploads: form.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload as PaymentUpload)
        },
        files: newFiles
      });
      return;
    }

    createPayment({ payment, files: newFiles });
    resetForm();
  };

  const pendingSubmit = isCreatePending || isUpdatePending;
  const currencyOptions = currencies.filter(
    (currency) => currency.id === cabinet?.currencyId || currency.id === selectedFirm?.currencyId
  );
  const hasCoverageMismatch = Math.abs(remainingAfterPayment) > 0.000001;
  const selectedTreasuryAccount = treasuryAccounts.find((account) => account.id === form.treasuryAccountId);
  const workflowTitle = isUpdateMode
    ? `${tInvoicing('payment.singular')} N° ${form.id || paymentId}`
    : !hasPaymentType
      ? tInvoicing('payment.new')
      : isSalesPayment
      ? tInvoicing('payment.workflow.new_sales', {
          defaultValue: 'Nouveau encaissement client'
        })
      : tInvoicing('payment.workflow.new_purchase', {
          defaultValue: 'Nouveau paiement fournisseur'
        });
  const partnerLabel = isSalesPayment
    ? tInvoicing('payment.attributes.customer')
    : hasPaymentType
      ? tInvoicing('payment.attributes.supplier')
      : tInvoicing('payment.type_selector.label', { defaultValue: 'Type de paiement' });
  const partnerPlaceholder = isSalesPayment
    ? tInvoicing('payment.associate_customer')
    : hasPaymentType
      ? tInvoicing('payment.associate_supplier')
      : tInvoicing('payment.type_selector.partner_empty', {
          defaultValue: 'Choisissez un type de paiement pour sélectionner un client ou fournisseur.'
        });
  const hasWithholdingConflict = selectedInvoicesHaveInvoiceWithholding && taxWithholdingEnabled;
  const formatTranslatedStatus = (status?: string) => (status ? tInvoicing(status) : '-');

  if (isLoading) {
    return <Spinner className="h-screen" show={isLoading} />;
  }

  return (
    <div className={cn('flex-1 overflow-auto bg-zinc-50/50 py-6 dark:bg-zinc-950', className)}>
      <div className={cn('mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 pb-10', pendingSubmit && 'pointer-events-none opacity-80')}>
        <PaymentWorkflowHeader
          backLabel={tCommon('commands.back')}
          onBack={() => router.push(backHref)}
          onReset={resetForm}
          onSubmit={handleSubmit}
          pending={pendingSubmit}
          resetLabel={tCommon('commands.initialize')}
          saveLabel={tCommon('commands.save')}
          submitDisabled={!hasPaymentType || !requiredReady}
          title={workflowTitle}
        />

        {requiredPermissionNoticeKeys.length > 0 ? (
          <div className="space-y-3">
            {requiredPermissionNoticeKeys.map((i18nKey) => (
              <PermissionNotice key={i18nKey} i18nKey={i18nKey} tone="danger" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <PaymentContextCard
              conversionRate={form.convertionRate}
              conversionRateLabel={tInvoicing('payment.attributes.convertion_rate')}
              currencies={currencyOptions}
              currencyFieldLabel={tInvoicing('payment.workflow.devise', { defaultValue: 'Devise' })}
              currencyId={form.currencyId}
              currencyLabel={(currency) =>
                `${currency.code ? tCurrency(currency.code) : currency.symbol} (${currency.symbol})`
              }
              currencyPlaceholder={tInvoicing('controls.currency_select_placeholder')}
              directionLabel={
                !hasPaymentType
                  ? tInvoicing('payment.type_selector.placeholder', {
                      defaultValue: 'Choisissez un type de paiement'
                    })
                  : isSalesPayment
                  ? tInvoicing('payment.workflow.incoming', { defaultValue: 'Entrant' })
                  : tInvoicing('payment.workflow.outgoing', { defaultValue: 'Sortant' })
              }
              modeLabel={
                !hasPaymentType
                  ? tInvoicing('payment.new')
                  : isSalesPayment
                  ? tInvoicing('payment.workflow.sales_payment', {
                      defaultValue: 'Encaissement client'
                    })
                  : tInvoicing('payment.workflow.purchase_payment', {
                      defaultValue: 'Paiement fournisseur'
                    })
              }
              onConversionRateChange={(value) => updateForm('convertionRate', value)}
              onCurrencyChange={handleCurrencyChange}
              title={tInvoicing('payment.workflow.context', { defaultValue: 'Contexte du paiement' })}
              typeControl={paymentTypeControl}
              typeHelperText={paymentTypeHelperText}
              typeLabel={tInvoicing('payment.type_selector.label', { defaultValue: 'Type de paiement' })}
            />

            <PartnerSelectorCard
              disabled={!hasPaymentType || !requiredReady}
              firmId={form.firmId}
              firms={firms}
              label={partnerLabel}
              onChange={handleFirmChange}
              placeholder={partnerPlaceholder}
              selectedFirm={selectedFirm}
              title={tInvoicing('payment.workflow.partner', { defaultValue: 'Partenaire' })}
            />

            <PayableDocumentsCard
              documents={payableInvoices}
              disabled={!hasPaymentType || !requiredReady}
              documentSearch={documentSearch}
              emptyLabel={tInvoicing('payment.no_invoices')}
              formatStatus={formatTranslatedStatus}
              getPaymentRemainingAmount={(invoice) =>
                convertInvoiceAmountToPaymentCurrency(
                  getInvoiceRemainingAmount(invoice),
                  invoice,
                  paymentCurrency,
                  form.convertionRate
                )
              }
              hasPartner={hasPaymentType && !!form.firmId}
              labels={{
                date: tInvoicing('invoice.attributes.date'),
                dueDate: tInvoicing('invoice.attributes.due_date'),
                number: tInvoicing('payment.attributes.number'),
                payment: tInvoicing('invoice.attributes.payment'),
                remaining: tInvoicing('invoice.attributes.remaining_amount'),
                status: tInvoicing('invoice.attributes.status'),
                total: tInvoicing('invoice.attributes.total')
              }}
              onDocumentSearchChange={setDocumentSearch}
              onOpenDocument={(invoice) => router.push(`${invoicePathPrefix}/${invoice.id}`)}
              onToggleDocument={toggleInvoice}
              onUpdateAllocation={updateInvoiceEntryAmount}
              searchPlaceholder={tCommon('filters.search_documents')}
              selectedEntries={invoiceEntries}
              selectPartnerLabel={
                hasPaymentType
                  ? tInvoicing('payment.workflow.select_partner_first', {
                      defaultValue:
                        'Selectionnez un client ou fournisseur pour afficher les documents.'
                    })
                  : tInvoicing('payment.type_selector.documents_empty', {
                      defaultValue:
                        'Choisissez un type de paiement pour afficher les documents à payer.'
                    })
              }
              title={tInvoicing('payment.workflow.documents', {
                defaultValue: 'Documents a payer'
              })}
            />

            {!canReadTreasury ? (
              <PermissionNotice i18nKey="rbac.bankingDetailsHidden" tone="info" />
            ) : null}
            <PaymentDetailsCard
              amount={form.amount}
              date={form.date}
              disabled={!hasPaymentType || !requiredReady}
              dueDate={form.dueDate}
              fee={form.fee}
              labels={{
                amount: tInvoicing('payment.workflow.money_amount', {
                  defaultValue: 'Montant payé en argent'
                }),
                date: tInvoicing('invoice.attributes.date'),
                dueDate: tInvoicing('payment.attributes.due_date'),
                fee: tInvoicing('payment.attributes.fee'),
                mode: tInvoicing('payment.attributes.mode'),
                modePlaceholder: tInvoicing('payment.attributes.mode'),
                reference: tInvoicing('payment.attributes.reference'),
                referencePlaceholder: tInvoicing('payment.placeholders.reference'),
                treasuryAccount: tInvoicing('payment.attributes.treasury_account'),
                treasuryPlaceholder: tInvoicing('payment.placeholders.treasury_account')
              }}
              mode={form.mode}
              modeOptions={paymentModeOptions}
              onAmountChange={handlePaymentAmountChange}
              onDateChange={(date) => updateForm('date', date)}
              onDueDateChange={(date) => updateForm('dueDate', date)}
              onFeeChange={handleFeeChange}
              onModeChange={handleModeChange}
              onReferenceChange={(value) => updateForm('reference', value)}
              onTreasuryAccountChange={(value) => updateForm('treasuryAccountId', value)}
              reference={form.reference}
              showDueDate={isNegotiableMode(form.mode)}
              title={tInvoicing('payment.workflow.details', { defaultValue: 'Details du paiement' })}
              translateMode={(paymentMode) => tInvoicing(paymentMode)}
              treasuryAccountId={form.treasuryAccountId}
              treasuryAccounts={treasuryAccounts}
              treasuryDisabled={isCreditNoteSettlement || !canReadTreasury}
              treasuryOptionalLabel={
                !canReadTreasury
                  ? tCommon('rbac.bankingDetailsHidden')
                  : tInvoicing('payment.workflow.no_treasury_for_avoir', {
                      defaultValue: 'Aucun mouvement de tresorerie pour un reglement par avoir.'
                    })
              }
            />

            {!canReadTaxes ? (
              <PermissionNotice i18nKey="rbac.taxesWithholdingDisabled" tone="info" />
            ) : (
              <WithholdingTaxCard
                amount={calculatedWithholdingAmount}
                baseAmount={totalAllocated}
                currency={paymentCurrency}
                date={form.taxWithholdingDate}
                disabled={!hasPaymentType || !requiredReady}
                enabled={taxWithholdingEnabled}
                labels={{
                  amount: tInvoicing('payment.workflow.withholding_amount', { defaultValue: 'Montant retenu' }),
                  base: tInvoicing('payment.workflow.withholding_base', { defaultValue: 'Base' }),
                  date: tInvoicing('payment.workflow.withholding_date', { defaultValue: 'Date' }),
                  no: tCommon('no', { defaultValue: 'Non' }),
                  placeholder: tInvoicing('payment.workflow.withholding', { defaultValue: 'Retenue' }),
                  type: tInvoicing('payment.workflow.withholding_type', { defaultValue: 'Type / taux' }),
                  yes: tCommon('yes', { defaultValue: 'Oui' })
                }}
                onDateChange={(date) => updateForm('taxWithholdingDate', date)}
                onEnabledChange={handleTaxWithholdingEnabledChange}
                onTaxChange={(value) => updateForm('taxWithholdingId', value)}
                taxWithholdingId={form.taxWithholdingId}
                taxWithholdings={taxWithholdings}
                title={tInvoicing('payment.workflow.withholding', {
                  defaultValue: 'Retenue a la source'
                })}
              />
            )}

            <CreditNotesCard
              creditNotes={availableCreditNotes}
              entries={creditNoteEntries}
              formatStatus={formatTranslatedStatus}
              hasPartner={hasPaymentType && !!form.firmId}
              isDisabled={!hasPaymentType || shouldDisableCreditNotes}
              isLoading={isFetchCreditNotesPending}
              labels={{
                available: tInvoicing('payment.workflow.credit_note_available', {
                  defaultValue: 'Disponible'
                }),
                convertedAmount: tInvoicing('payment.workflow.credit_note_converted_amount', {
                  defaultValue: 'Montant converti'
                }),
                exchangeRate: tInvoicing('payment.workflow.credit_note_exchange_rate', {
                  defaultValue: 'Taux'
                }),
                originalAmount: tInvoicing('payment.workflow.credit_note_original_amount', {
                  defaultValue: 'Montant utilise'
                }),
                status: tInvoicing('invoice.attributes.status')
              }}
              loadingLabel={tCommon('loading')}
              noCreditNotesLabel={tInvoicing('payment.workflow.no_credit_notes', {
                defaultValue: 'Aucun avoir disponible.'
              })}
              onAmountChange={updateCreditNoteEntry}
              onRateChange={updateCreditNoteRate}
              paymentCurrency={paymentCurrency}
              selectPartnerLabel={
                hasPaymentType
                  ? tInvoicing('payment.workflow.select_partner_for_credit_notes', {
                      defaultValue: 'Selectionnez un partenaire pour afficher les avoirs.'
                    })
                  : tInvoicing('payment.type_selector.credit_notes_empty', {
                      defaultValue: 'Choisissez un type de paiement pour afficher les avoirs.'
                    })
              }
              title={tInvoicing('payment.workflow.credit_notes', {
                defaultValue: 'Avoirs disponibles'
              })}
              warningLabel={tInvoicing('payment.workflow.credit_notes_disabled_for_instruments', {
                defaultValue: 'Les avoirs ne peuvent pas etre utilises avec les cheques et traites.'
              })}
            />

            <PaymentNotesAttachmentsCard
              files={form.uploadedFiles.map((uploadedFile) => uploadedFile.file)}
              filesLabel={tInvoicing('payment.attributes.files')}
              notes={form.notes}
              notesLabel={tInvoicing('payment.attributes.notes')}
              onFilesChange={handleFilesChange}
              onNotesChange={(value) => updateForm('notes', value)}
              title={tInvoicing('payment.workflow.notes_files', {
                defaultValue: 'Notes et pieces jointes'
              })}
            />
          </div>

          <PaymentSummaryPanel
            conversionRate={form.convertionRate}
            coverageTotal={coverageTotal}
            creditNoteCoverage={creditNoteUsedAmount}
            currency={paymentCurrency}
            fee={form.fee || 0}
            hasCoverageMismatch={hasCoverageMismatch}
            hasWithholdingConflict={hasWithholdingConflict}
            labels={{
              coverageTotal: tInvoicing('payment.workflow.coverage_total', {
                defaultValue: 'Couverture totale'
              }),
              creditNoteCoverage: tInvoicing('payment.workflow.credit_note_used', {
                defaultValue: 'Montant utilise par avoir'
              }),
              currency: tInvoicing('payment.workflow.devise', { defaultValue: 'Devise' }),
              fee: tInvoicing('payment.attributes.fee'),
              moneyAmount: tInvoicing('payment.workflow.money_amount', {
                defaultValue: 'Montant paye en argent'
              }),
              remainingAfterPayment: tInvoicing('payment.workflow.remaining_after_payment', {
                defaultValue: 'Reste apres paiement'
              }),
              selectedDocuments: tInvoicing('payment.workflow.selected_documents', {
                defaultValue: 'Documents selectionnes'
              }),
              totalRemaining: tInvoicing('payment.workflow.total_remaining', {
                defaultValue: 'Montant a couvrir'
              }),
              treasuryAccount: tInvoicing('payment.attributes.treasury_account'),
              treasuryMovement: tInvoicing('payment.workflow.treasury_movement', {
                defaultValue: 'Mouvement de tresorerie'
              }),
              withholdingAmount: tInvoicing('payment.workflow.withholding_amount', {
                defaultValue: 'Retenue a la source'
              })
            }}
            moneyAmount={form.amount || 0}
            partnerLabel={partnerLabel}
            partnerName={selectedFirm?.name}
            remainingAfterPayment={remainingAfterPayment}
            selectedDocumentsCount={invoiceEntries.length}
            selectedTreasuryAccount={selectedTreasuryAccount}
            title={tInvoicing('payment.workflow.summary', { defaultValue: 'Resume' })}
            totalAllocated={totalAllocated}
            treasuryMovementAmount={form.amount || 0}
            warnings={{
              coverageMismatch: tInvoicing('payment.workflow.coverage_warning', {
                defaultValue:
                  'Le montant paye, les frais, les avoirs et la retenue doivent couvrir exactement les documents selectionnes.'
              }),
              withholdingConflict: tInvoicing('payment.errors.withholding_double_apply', {
                defaultValue:
                  'Retenue a la source already exists on a selected invoice. Remove it before applying payment-level withholding.'
              })
            }}
            withholdingAmount={calculatedWithholdingAmount}
          />
        </div>
        )}
      </div>
    </div>
  );
};

import { PAYMENT_FILTER_ATTRIBUTES } from '@/constants/payment-filter.attributes';
import {
  ACTIVITY_TYPE,
  CreatePaymentDto,
  NEGOTIABLE_PAYMENT_MODES,
  PagedPayment,
  Payment,
  PAYMENT_COLLECTION_STATUS,
  PAYMENT_MODE,
  PaymentUploadedFile,
  ToastValidation,
  UpdatePaymentDto
} from '@/types';
import axios from './axios';
import { upload } from './upload';

export interface PaymentPaginatedFilters {
  activityType?: ACTIVITY_TYPE;
  collectionStatus?: PAYMENT_COLLECTION_STATUS;
  dueEndDate?: string;
  dueStartDate?: string;
  endDate?: string;
  maxAmount?: number;
  minAmount?: number;
  mode?: string;
  modes?: string[];
  startDate?: string;
  taxWithholdingEndDate?: string;
  taxWithholdingStartDate?: string;
  treasuryAccountId?: number;
  withholdingOnly?: boolean;
}

const buildPaymentFilters = (
  search: string,
  firmId?: number,
  interlocutorId?: number,
  filters: PaymentPaginatedFilters = {}
) => {
  const andConditions = [
    filters.activityType ? `activityType||$eq||${filters.activityType}` : '',
    firmId ? `firmId||$eq||${firmId}` : '',
    interlocutorId ? `interlocutorId||$cont||${interlocutorId}` : '',
    filters.modes?.length ? `mode||$in||${filters.modes.join(',')}` : '',
    filters.mode ? `mode||$eq||${filters.mode}` : '',
    filters.startDate ? `date||$gte||${filters.startDate}` : '',
    filters.endDate ? `date||$lte||${filters.endDate}` : '',
    filters.taxWithholdingStartDate
      ? `taxWithholdingDate||$gte||${filters.taxWithholdingStartDate}`
      : '',
    filters.taxWithholdingEndDate
      ? `taxWithholdingDate||$lte||${filters.taxWithholdingEndDate}`
      : '',
    filters.dueStartDate ? `dueDate||$gte||${filters.dueStartDate}` : '',
    filters.dueEndDate ? `dueDate||$lte||${filters.dueEndDate}` : '',
    typeof filters.minAmount === 'number' ? `amount||$gte||${filters.minAmount}` : '',
    typeof filters.maxAmount === 'number' ? `amount||$lte||${filters.maxAmount}` : '',
    filters.collectionStatus ? `collectionStatus||$eq||${filters.collectionStatus}` : '',
    typeof filters.treasuryAccountId === 'number'
      ? `treasuryAccountId||$eq||${filters.treasuryAccountId}`
      : '',
    filters.withholdingOnly ? 'taxWithholdingAmount||$gt||0' : ''
  ].filter(Boolean);

  const trimmedSearch = search.trim();
  if (!trimmedSearch) {
    return andConditions.join(';');
  }

  return Object.values(PAYMENT_FILTER_ATTRIBUTES)
    .map((key) => [`${key}||$cont||${trimmedSearch}`, ...andConditions].filter(Boolean).join(';'))
    .join('||$or||');
};

const findOne = async (
  id: number,
  relations: string[] = [
    'firm',
    'firm.currency',
    'currency',
    'treasuryAccount',
    'originTreasuryAccount',
    'taxWithholding',
    'invoices',
    'invoices.invoice',
    'invoices.invoice.currency',
    'creditNotes',
    'creditNotes.creditNote',
    'creditNotes.creditNote.currency',
    'uploads',
    'uploads.upload'
  ]
): Promise<Payment & { files: PaymentUploadedFile[] }> => {
  const response = await axios.get<Payment>(`public/payment/${id}?join=${relations.join(',')}`);
  return { ...response.data, files: await getPaymentUploads(response.data) };
};

const findOneForAttachments = async (id: number): Promise<Payment> => {
  const relations = [
    'firm',
    'currency',
    'treasuryAccount',
    'originTreasuryAccount',
    'uploads',
    'uploads.upload'
  ];
  const response = await axios.get<Payment>(`public/payment/${id}?join=${relations.join(',')}`);
  return response.data;
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  search: string = '',
  relations: string[] = [],
  firmId?: number,
  interlocutorId?: number,
  filters: PaymentPaginatedFilters = {}
): Promise<PagedPayment> => {
  const queryFilters = buildPaymentFilters(search, firmId, interlocutorId, filters);

  const response = await axios.get<PagedPayment>(
    new String().concat(
      'public/payment/list?',
      `sort=${sortKey},${order}&`,
      `filter=${queryFilters}&`,
      `limit=${size}&page=${page}&`,
      `join=${relations.join(',')}`
    )
  );
  return response.data;
};

const findNegotiablePaginated = async (
  page: number = 1,
  size: number = 10,
  order: 'ASC' | 'DESC' = 'DESC',
  sortKey: string = 'dueDate',
  search: string = '',
  activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  filters: Omit<PaymentPaginatedFilters, 'activityType' | 'modes'> = {},
  relations: string[] = ['firm', 'currency', 'treasuryAccount', 'originTreasuryAccount']
): Promise<PagedPayment> =>
  findPaginated(page, size, order, sortKey, search, relations, undefined, undefined, {
    ...filters,
    activityType,
    modes: NEGOTIABLE_PAYMENT_MODES
  });

const create = async (payment: CreatePaymentDto, files: File[] = []): Promise<Payment> => {
  const uploadIds = files && files?.length > 0 ? await upload.uploadFiles(files) : [];
  const response = await axios.post<CreatePaymentDto>('public/payment', {
    ...payment,
    activityType: payment.activityType || ACTIVITY_TYPE.SELLING,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const getPaymentUploads = async (payment: Payment): Promise<PaymentUploadedFile[]> => {
  if (!payment?.uploads) return [];

  const uploads = await Promise.all(
    payment.uploads.map(async (u) => {
      if (u?.upload?.slug) {
        const blob = await upload.fetchBlobBySlug(u.upload.slug);
        const filename = u.upload.filename || '';
        if (blob)
          return { upload: u, file: new File([blob], filename, { type: u.upload.mimetype }) };
      }
      return { upload: u, file: undefined };
    })
  );
  return uploads
    .filter((u) => !!u.file)
    .sort(
      (a, b) =>
        new Date(a.upload.createdAt ?? 0).getTime() - new Date(b.upload.createdAt ?? 0).getTime()
    ) as PaymentUploadedFile[];
};

const update = async (payment: UpdatePaymentDto, files: File[] = []): Promise<Payment> => {
  const uploadIds = files && files?.length > 0 ? await upload.uploadFiles(files) : [];
  const response = await axios.put<Payment>(`public/payment/${payment.id}`, {
    ...payment,
    activityType: payment.activityType || ACTIVITY_TYPE.SELLING,
    uploads: [
      ...(payment.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return response.data;
};

const remove = async (id: number): Promise<Payment> => {
  const response = await axios.delete<Payment>(`public/payment/${id}`);
  return response.data;
};

const removeWithholding = async (id: number): Promise<Payment> => {
  const response = await axios.patch<Payment>(`public/payment/${id}/remove-withholding`);
  return response.data;
};

const depositInstrument = async (id: number, bankAccountId: number): Promise<Payment> => {
  const response = await axios.post<Payment>(`public/payment/${id}/deposit`, { bankAccountId });
  return response.data;
};

const markInstrumentPaid = async (id: number): Promise<Payment> => {
  const response = await axios.post<Payment>(`public/payment/${id}/mark-paid`);
  return response.data;
};

const rejectInstrument = async (id: number, reason?: string): Promise<Payment> => {
  const response = await axios.post<Payment>(`public/payment/${id}/reject`, { reason });
  return response.data;
};

const cancelInstrumentDeposit = async (id: number): Promise<Payment> => {
  const response = await axios.post<Payment>(`public/payment/${id}/cancel-deposit`);
  return response.data;
};

const fetchReceiptBlob = async (
  id: number,
  action: 'preview' | 'download'
): Promise<Blob> => {
  const response = await axios.get<Blob>(`public/payment/${id}/receipt/${action}`, {
    responseType: 'blob'
  });
  return new Blob([response.data], { type: 'application/pdf' });
};

const previewReceipt = async (id: number): Promise<Blob> => fetchReceiptBlob(id, 'preview');

const downloadReceipt = async (id: number): Promise<Blob> => fetchReceiptBlob(id, 'download');

const isNegotiableMode = (mode?: PAYMENT_MODE | string) =>
  NEGOTIABLE_PAYMENT_MODES.includes(mode as PAYMENT_MODE);

const isCreditNoteSettlementMode = (mode?: PAYMENT_MODE | string) =>
  mode === PAYMENT_MODE.CreditNoteSettlement;

const getCreditNoteCoverage = (payment: Partial<Payment>) =>
  (payment.creditNotes || []).reduce(
    (sum, creditNote) =>
      sum + Number(creditNote?.convertedAmount ?? creditNote?.amount ?? 0),
    0
  );

const validate = (payment: Partial<Payment>, used: number, paid: number): ToastValidation => {
  const normalizedUsed = Number((used || 0).toFixed(6));
  const normalizedPaid = Number((paid || 0).toFixed(6));
  const moneyAmount = Number(payment.amount || 0);
  const creditNoteCoverage = Number(getCreditNoteCoverage(payment).toFixed(6));
  const hasCreditNoteCoverage = creditNoteCoverage > 0;
  const isCreditNoteSettlement = isCreditNoteSettlementMode(payment.mode);
  const hasInvoiceAllocation = Array.isArray(payment?.invoices)
    ? payment.invoices.some((invoice) => (invoice?.invoiceId || 0) > 0 && (invoice?.amount || 0) > 0)
    : false;

  if (!payment.date) return { message: 'payment.errors.date_required' };
  if (!payment.mode) return { message: 'payment.errors.mode_required' };
  if (!payment?.firmId) return { message: 'payment.errors.firm_required' };
  if (!payment?.currencyId) return { message: 'payment.errors.currency_required' };
  if (isCreditNoteSettlement) {
    if (moneyAmount !== 0) return { message: 'payment.errors.avoir_money_zero_required' };
    if (!hasCreditNoteCoverage) return { message: 'payment.errors.avoir_required' };
  } else if (moneyAmount <= 0) {
    return { message: 'payment.errors.amount_positive_or_avoir' };
  }
  if (payment?.fee == null || payment?.fee < 0)
    return { message: 'payment.errors.fee_non_negative' };
  if (!payment?.convertionRate || payment?.convertionRate <= 0)
    return { message: 'payment.errors.convertion_rate_positive' };
  if (!isCreditNoteSettlement && !payment.treasuryAccountId)
    return { message: 'payment.errors.treasury_account_required' };

  if (isNegotiableMode(payment.mode)) {
    if (hasCreditNoteCoverage) return { message: 'payment.errors.avoir_not_allowed_with_instrument' };
    if (!payment.reference?.trim()) return { message: 'payment.errors.reference_required' };
    if (!payment.dueDate) return { message: 'payment.errors.due_date_required' };

    const paymentDate = new Date(payment.date);
    const paymentDueDate = new Date(payment.dueDate);
    if (
      !Number.isNaN(paymentDate.getTime()) &&
      !Number.isNaN(paymentDueDate.getTime()) &&
      paymentDueDate.getTime() < paymentDate.getTime()
    ) {
      return { message: 'payment.errors.due_date_after_date' };
    }
  }

  if (
    normalizedPaid > 0 &&
    !hasInvoiceAllocation
  )
    return { message: 'payment.errors.invoice_allocation_required' };
  if (payment.taxWithholdingId && !payment.taxWithholdingDate)
    return { message: 'payment.errors.tax_withholding_date_required' };
  if (
    Array.isArray(payment.creditNotes) &&
    payment.creditNotes.some((creditNote) => Number(creditNote?.amount || 0) <= 0)
  )
    return { message: 'payment.errors.credit_note_amount_positive' };
  if (
    Array.isArray(payment.creditNotes) &&
    payment.creditNotes.some((creditNote) => Number(creditNote?.convertedAmount ?? creditNote?.amount ?? 0) <= 0)
  )
    return { message: 'payment.errors.credit_note_converted_amount_positive' };
  if (
    Array.isArray(payment.creditNotes) &&
    payment.creditNotes.some(
      (creditNote) =>
        creditNote?.originalCurrencyId &&
        creditNote?.convertedCurrencyId &&
        creditNote.originalCurrencyId !== creditNote.convertedCurrencyId &&
        Number(creditNote.exchangeRateToPaymentCurrency || 0) <= 0
    )
  )
    return { message: 'payment.errors.credit_note_exchange_rate_required' };
  if (Math.abs(normalizedPaid - normalizedUsed) > 0.000001)
    return { message: 'payment.errors.invoice_allocation_total_mismatch' };
  return { message: '', position: 'bottom-right' };
};

export const payment = {
  findOne,
  findOneForAttachments,
  findPaginated,
  findNegotiablePaginated,
  create,
  update,
  remove,
  removeWithholding,
  depositInstrument,
  markInstrumentPaid,
  rejectInstrument,
  cancelInstrumentDeposit,
  previewReceipt,
  downloadReceipt,
  validate
};

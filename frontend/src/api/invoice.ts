import axios from './axios';
import { differenceInDays } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import {
  ACTIVITY_TYPE,
  CreateInvoiceDto,
  DateRange,
  DuplicateInvoiceDto,
  INVOICE_STATUS,
  Invoice,
  InvoiceUploadedFile,
  PagedInvoice,
  ResponseInvoiceRangeDto,
  ToastValidation,
  UpdateInvoiceDto,
  UpdateInvoiceSequentialNumber
} from '@/types';
import { INVOICE_FILTER_ATTRIBUTES } from '@/constants/invoice.filter-attributes';
import { createDocumentApi, downloadBlob } from './utils/document-api-factory';
import { validateDocumentDateRange } from './utils/document-date-validation';

const baseApi = createDocumentApi<Invoice>({
  entityPath: 'invoice',
  filterAttributes: INVOICE_FILTER_ATTRIBUTES,
  defaultListRelations: ['firm', 'interlocutor'],
  defaultFindOneRelations: [
    'firm',
    'currency',
    'bankAccount',
    'quotation',
    'interlocutor',
    'firm.currency',
    'creditNotes',
    'invoiceMetaData',
    'uploads',
    'uploads.upload',
    'payments',
    'payments.payment',
    'taxWithholding',
    'firm.deliveryAddress',
    'firm.invoicingAddress',
    'articleInvoiceEntries',
    'firm.interlocutorsToFirm',
    'articleInvoiceEntries.article',
    'articleInvoiceEntries.articleInvoiceEntryTaxes',
    'articleInvoiceEntries.articleInvoiceEntryTaxes.tax'
  ]
});

const normalizeSellingInvoiceStatus = (invoice?: Invoice | null): Invoice | null | undefined => {
  if (!invoice) {
    return invoice;
  }

  if (
    invoice.activityType === ACTIVITY_TYPE.SELLING &&
    invoice.status &&
    [INVOICE_STATUS.Validated, INVOICE_STATUS.Sent, INVOICE_STATUS.Expired].includes(invoice.status)
  ) {
    return {
      ...invoice,
      status: INVOICE_STATUS.Unpaid
    };
  }

  return invoice;
};

const normalizePagedInvoices = (paged: PagedInvoice): PagedInvoice => ({
  ...paged,
  data: (paged.data || []).map((invoice) => normalizeSellingInvoiceStatus(invoice) as Invoice)
});

export interface FindPaginatedInvoiceOptions {
  search?: string;
  relations?: string[];
  activityType?: ACTIVITY_TYPE;
  firmId?: number;
  interlocutorId?: number;
  status?: INVOICE_STATUS;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

const factory = (): CreateInvoiceDto => {
  return {
    date: '',
    dueDate: '',
    activityType: ACTIVITY_TYPE.SELLING,
    status: INVOICE_STATUS.Unpaid,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleInvoiceEntries: [],
    invoiceMetaData: {
      showDeliveryAddress: true,
      showInvoiceAddress: true,
      hasBankingDetails: true,
      hasGeneralConditions: true,
      showArticleDescription: true,
      taxSummary: []
    },
    files: []
  };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  searchOrOptions: string | FindPaginatedInvoiceOptions = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedInvoice> => {
  const paged = await (baseApi.findPaginated(
    page,
    size,
    order,
    sortKey,
    searchOrOptions,
    relations,
    firmId,
    interlocutorId
  ) as Promise<PagedInvoice>);
  return normalizePagedInvoices(paged);
};

const findOne = async (
  id: number,
  relations?: string[]
): Promise<Invoice & { files: InvoiceUploadedFile[] }> => {
  const data = normalizeSellingInvoiceStatus(
    (await baseApi.findOne(id, relations)) as Invoice
  ) as Invoice;
  return { ...data, files: (await baseApi.getUploads(data)) as InvoiceUploadedFile[] };
};

const findByRange = async (id?: number): Promise<ResponseInvoiceRangeDto> => {
  const response = await axios.get<ResponseInvoiceRangeDto>(
    `public/invoice/sequential-range/${id}`
  );
  return response.data;
};

const create = async (invoice: CreateInvoiceDto, files: File[]): Promise<Invoice> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.post<Invoice>('public/invoice', {
    ...invoice,
    activityType: invoice.activityType || ACTIVITY_TYPE.SELLING,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return normalizeSellingInvoiceStatus(response.data) as Invoice;
};

const preview = async (id: number, template: string): Promise<Blob> => {
  return baseApi.fetchPdfBlob(id, template);
};

const download = async (id: number, template: string): Promise<Blob> => {
  const invoice = await findOne(id, []);
  const blob = await baseApi.fetchPdfBlob(id, template);
  const filename =
    invoice.activityType === ACTIVITY_TYPE.BUYING
      ? invoice.reference || invoice.sequential || `invoice-${invoice.id}`
      : invoice.sequential || `invoice-${invoice.id}`;
  downloadBlob(blob, `${filename}.pdf`);
  return blob;
};

interface SendInvoiceEmailPayload {
  to: string;
  cc?: string;
  subject: string;
  message: string;
  template?: string;
}

const sendEmail = async (
  id: number,
  payload: SendInvoiceEmailPayload
): Promise<{ success: boolean }> => {
  const response = await axios.post<{ success: boolean }>(`public/invoice/${id}/send-email`, {
    ...payload,
    template: payload.template || 'template1'
  });
  return response.data;
};

const { duplicate } = baseApi;

const update = async (invoice: UpdateInvoiceDto, files: File[]): Promise<Invoice> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.put<Invoice>(`public/invoice/${invoice.id}`, {
    ...invoice,
    activityType: invoice.activityType || ACTIVITY_TYPE.SELLING,
    uploads: [
      ...(invoice.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return normalizeSellingInvoiceStatus(response.data) as Invoice;
};

const saveFromCustomerOrder = async (id: number): Promise<Invoice> => {
  const response = await axios.post<Invoice>(`public/invoice/from-customer-order/${id}`);
  return normalizeSellingInvoiceStatus(response.data) as Invoice;
};

const remove = async (id: number): Promise<Invoice> => {
  return baseApi.remove(id) as Promise<Invoice>;
};

const validate = (invoice: Partial<Invoice>, dateRange?: DateRange): ToastValidation => {
  if (!invoice.date) return { message: 'La date est obligatoire' };
  const invoiceDate = new Date(invoice.date);
  const dateRangeError = validateDocumentDateRange(invoiceDate, dateRange);
  if (dateRangeError) return { message: dateRangeError };
  if (!invoice.dueDate) return { message: "L'échéance est obligatoire" };
  if (invoice.activityType === ACTIVITY_TYPE.BUYING && !invoice.reference?.trim()) {
    return { message: "La référence de la facture d'achat est obligatoire" };
  }
  if (!invoice.object) return { message: "L'objet est obligatoire" };
  const dueDate = new Date(invoice.dueDate);
  if (differenceInDays(invoiceDate, dueDate) > 0) {
    return { message: "L'échéance doit être supérieure ou égale à la date" };
  }
  if (!invoice.firmId || !invoice.interlocutorId) {
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  }
  if (!invoice.articleInvoiceEntries?.length) {
    return { message: 'Veuillez ajouter au moins un article' };
  }
  return { message: '' };
};

const updateInvoicesSequentials = async (updatedSequenceDto: UpdateInvoiceSequentialNumber) => {
  const response = await axios.put<Invoice>(
    'public/invoice/update-invoice-sequences',
    updatedSequenceDto
  );
  return response.data;
};

export const invoice = {
  factory,
  findPaginated,
  findOne,
  findByRange,
  create,
  preview,
  download,
  sendEmail,
  duplicate,
  update,
  saveFromCustomerOrder,
  updateInvoicesSequentials,
  remove,
  validate
};

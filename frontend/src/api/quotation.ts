import axios from './axios';
import { differenceInDays } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import {
  ACTIVITY_TYPE,
  ArticleQuotationEntry,
  CreateQuotationDto,
  DuplicateQuotationDto,
  PagedQuotation,
  QUOTATION_STATUS,
  Quotation,
  QuotationUploadedFile,
  ToastValidation,
  UpdateQuotationDto,
  UpdateQuotationSequentialNumber
} from '@/types';
import { QUOTATION_FILTER_ATTRIBUTES } from '@/constants/quotation.filter-attributes';
import { createDocumentApi } from './utils/document-api-factory';

const baseApi = createDocumentApi<Quotation>({
  entityPath: 'quotation',
  filterAttributes: QUOTATION_FILTER_ATTRIBUTES,
  defaultListRelations: ['firm', 'interlocutor'],
  defaultFindOneRelations: [
    'firm', 'currency', 'bankAccount', 'interlocutor', 'firm.currency',
    'quotationMetaData', 'uploads', 'invoices', 'uploads.upload',
    'firm.deliveryAddress', 'firm.invoicingAddress',
    'articleQuotationEntries', 'firm.interlocutorsToFirm',
    'articleQuotationEntries.article',
    'articleQuotationEntries.articleQuotationEntryTaxes',
    'articleQuotationEntries.articleQuotationEntryTaxes.tax'
  ]
});

export interface FindPaginatedQuotationOptions {
  search?: string;
  relations?: string[];
  activityType?: ACTIVITY_TYPE;
  firmId?: number;
  interlocutorId?: number;
  status?: QUOTATION_STATUS;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

const factory = (): CreateQuotationDto => {
  return {
    date: '',
    dueDate: '',
    activityType: ACTIVITY_TYPE.SELLING,
    status: QUOTATION_STATUS.Draft,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleQuotationEntries: [],
    quotationMetaData: {
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
  searchOrOptions: string | FindPaginatedQuotationOptions = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedQuotation> => {
  return baseApi.findPaginated(page, size, order, sortKey, searchOrOptions, relations, firmId, interlocutorId) as Promise<PagedQuotation>;
};

const findChoices = async (
  status: QUOTATION_STATUS,
  activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING
): Promise<Quotation[]> => {
  const response = await axios.get<Quotation[]>(
    `public/quotation/all?filter=status||$eq||${status};activityType||$eq||${activityType}`
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations?: string[]
): Promise<Quotation & { files: QuotationUploadedFile[] }> => {
  const data = await baseApi.findOne(id, relations) as Quotation;
  return { ...data, files: await baseApi.getUploads(data) as QuotationUploadedFile[] };
};

const create = async (quotation: CreateQuotationDto, files: File[]): Promise<Quotation> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.post<Quotation>('public/quotation', {
    ...quotation,
    activityType: quotation.activityType || ACTIVITY_TYPE.SELLING,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const { preview, download, duplicate } = baseApi;

interface SendQuotationEmailPayload {
  to: string;
  cc?: string;
  subject: string;
  message: string;
  template?: string;
}

const sendEmail = async (
  id: number,
  payload: SendQuotationEmailPayload
): Promise<{ success: boolean }> => {
  const response = await axios.post<{ success: boolean }>(`public/quotation/${id}/send-email`, {
    ...payload,
    template: payload.template || 'template1'
  });
  return response.data;
};

const update = async (quotation: UpdateQuotationDto, files: File[]): Promise<Quotation> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.put<Quotation>(`public/quotation/${quotation.id}`, {
    ...quotation,
    activityType: quotation.activityType || ACTIVITY_TYPE.SELLING,
    uploads: [
      ...(quotation.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return response.data;
};

const updateStatus = async (id: number, status: QUOTATION_STATUS): Promise<Quotation> => {
  const response = await axios.put<Quotation>(`public/quotation/${id}/status`, { status });
  return response.data;
};

const invoice = async (id?: number, createInvoice?: boolean): Promise<Quotation> => {
  const response = await axios.put<Quotation>(`public/quotation/invoice/${id}/${createInvoice}`);
  return response.data;
};

const remove = async (id: number): Promise<Quotation> => {
  return baseApi.remove(id) as Promise<Quotation>;
};

const validate = (quotation: Partial<Quotation>): ToastValidation => {
  if (!quotation.date) return { message: 'La date est obligatoire' };
  if (!quotation.dueDate) return { message: "L'échéance est obligatoire" };
  if (!quotation.object) return { message: "L'objet est obligatoire" };
  if (differenceInDays(new Date(quotation.date), new Date(quotation.dueDate)) >= 0)
    return { message: "L'échéance doit être supérieure à la date" };
  if (!quotation.firmId || !quotation.interlocutorId)
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  if (!quotation.articleQuotationEntries?.length)
    return { message: 'Veuillez ajouter au moins un article' };
  return { message: '' };
};

const updateQuotationsSequentials = async (updatedSequenceDto: UpdateQuotationSequentialNumber) => {
  const response = await axios.put<Quotation>(
    'public/quotation/update-quotation-sequences',
    updatedSequenceDto
  );
  return response.data;
};

export const quotation = {
  factory,
  findPaginated,
  findOne,
  findChoices,
  create,
  preview,
  download,
  sendEmail,
  invoice,
  duplicate,
  update,
  updateStatus,
  updateQuotationsSequentials,
  remove,
  validate
};

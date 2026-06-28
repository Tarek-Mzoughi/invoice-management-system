import axios from './axios';
import { differenceInDays } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import {
  ACTIVITY_TYPE,
  ArticleCustomerOrderEntry,
  CreateCustomerOrderDto,
  DuplicateCustomerOrderDto,
  PagedCustomerOrder,
  CUSTOMER_ORDER_STATUS,
  CustomerOrder,
  CustomerOrderUploadedFile,
  ToastValidation,
  UpdateCustomerOrderDto,
  UpdateCustomerOrderSequentialNumber
} from '@/types';
import { CUSTOMER_ORDER_FILTER_ATTRIBUTES } from '@/constants/customer-order.filter-attributes';
import { createDocumentApi } from './utils/document-api-factory';

const baseApi = createDocumentApi<CustomerOrder>({
  entityPath: 'customerOrder',
  filterAttributes: CUSTOMER_ORDER_FILTER_ATTRIBUTES,
  defaultListRelations: ['firm', 'interlocutor'],
  defaultFindOneRelations: [
    'firm', 'currency', 'bankAccount', 'interlocutor', 'firm.currency',
    'customerOrderMetaData', 'uploads', 'invoices', 'deliveryNotes', 'uploads.upload',
    'firm.deliveryAddress', 'firm.invoicingAddress',
    'articleCustomerOrderEntries', 'firm.interlocutorsToFirm',
    'articleCustomerOrderEntries.article',
    'articleCustomerOrderEntries.articleCustomerOrderEntryTaxes',
    'articleCustomerOrderEntries.articleCustomerOrderEntryTaxes.tax'
  ]
});

export interface FindPaginatedCustomerOrderOptions {
  search?: string;
  relations?: string[];
  activityType?: ACTIVITY_TYPE;
  firmId?: number;
  interlocutorId?: number;
  status?: CUSTOMER_ORDER_STATUS;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

const factory = (): CreateCustomerOrderDto => {
  return {
    date: '',
    dueDate: '',
    activityType: ACTIVITY_TYPE.SELLING,
    reference: '',
    status: CUSTOMER_ORDER_STATUS.Draft,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleCustomerOrderEntries: [],
    customerOrderMetaData: {
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
  searchOrOptions: string | FindPaginatedCustomerOrderOptions = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedCustomerOrder> => {
  return baseApi.findPaginated(page, size, order, sortKey, searchOrOptions, relations, firmId, interlocutorId) as Promise<PagedCustomerOrder>;
};

const findChoices = async (
  status: CUSTOMER_ORDER_STATUS,
  activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING
): Promise<CustomerOrder[]> => {
  const response = await axios.get<CustomerOrder[]>(
    `public/customerOrder/all?filter=status||$eq||${status};activityType||$eq||${activityType}`
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations?: string[]
): Promise<CustomerOrder & { files: CustomerOrderUploadedFile[] }> => {
  const data = await baseApi.findOne(id, relations) as CustomerOrder;
  return { ...data, files: await baseApi.getUploads(data) as CustomerOrderUploadedFile[] };
};

const create = async (customerOrder: CreateCustomerOrderDto, files: File[]): Promise<CustomerOrder> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.post<CustomerOrder>('public/customerOrder', {
    ...customerOrder,
    activityType: customerOrder.activityType || ACTIVITY_TYPE.SELLING,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const { preview, download, sendEmail, duplicate } = baseApi;

const update = async (customerOrder: UpdateCustomerOrderDto, files: File[]): Promise<CustomerOrder> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.put<CustomerOrder>(`public/customerOrder/${customerOrder.id}`, {
    ...customerOrder,
    activityType: customerOrder.activityType || ACTIVITY_TYPE.SELLING,
    uploads: [
      ...(customerOrder.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return response.data;
};

const updateStatus = async (id: number, status: CUSTOMER_ORDER_STATUS): Promise<CustomerOrder> => {
  const response = await axios.put<CustomerOrder>(`public/customerOrder/${id}/status`, { status });
  return response.data;
};

const validateStatus = async (id: number): Promise<CustomerOrder> => {
  const response = await axios.post<CustomerOrder>(`public/customerOrder/${id}/validate`);
  return response.data;
};

const cancelStatus = async (id: number): Promise<CustomerOrder> => {
  const response = await axios.post<CustomerOrder>(`public/customerOrder/${id}/cancel`);
  return response.data;
};

const invoice = async (id?: number, createInvoice?: boolean): Promise<CustomerOrder> => {
  const response = await axios.put<CustomerOrder>(`public/customerOrder/invoice/${id}/${createInvoice}`);
  return response.data;
};

const findByRange = async (id?: number): Promise<{ previous?: { date?: string }; next?: { date?: string } }> => {
  return {};
};

const remove = async (id: number): Promise<CustomerOrder> => {
  return baseApi.remove(id) as Promise<CustomerOrder>;
};

const validate = (customerOrder: Partial<CustomerOrder>): ToastValidation => {
  if (!customerOrder.date) return { message: 'La date est obligatoire' };
  if (!customerOrder.dueDate) return { message: "La date de livraison prévue est obligatoire" };
  if (customerOrder.activityType === ACTIVITY_TYPE.BUYING && !customerOrder.reference?.trim()) {
    return { message: 'La référence de la commande fournisseur est obligatoire' };
  }
  if (!customerOrder.object) return { message: "L'objet est obligatoire" };
  if (differenceInDays(new Date(customerOrder.date), new Date(customerOrder.dueDate)) >= 0)
    return { message: "La date de livraison prévue doit être supérieure à la date" };
  if (!customerOrder.firmId || !customerOrder.interlocutorId)
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  if (!customerOrder.articleCustomerOrderEntries?.length)
    return { message: 'Veuillez ajouter au moins un article' };
  return { message: '' };
};

const updateCustomerOrdersSequentials = async (updatedSequenceDto: UpdateCustomerOrderSequentialNumber) => {
  const response = await axios.put<CustomerOrder>(
    `/public/customerOrder/update-customerOrder-sequences`,
    updatedSequenceDto
  );
  return response.data;
};

export const customerOrder = {
  factory,
  findPaginated,
  findByRange,
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
  validateStatus,
  cancelStatus,
  updateCustomerOrdersSequentials,
  remove,
  validate,
  saveFromQuotation: async (id: number): Promise<CustomerOrder> => {
    const response = await axios.post<CustomerOrder>(`public/customerOrder/from-quotation/${id}`);
    return response.data;
  }
};

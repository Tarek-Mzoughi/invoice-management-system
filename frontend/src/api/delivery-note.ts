import axios from './axios';
import { differenceInDays } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import {
  ACTIVITY_TYPE,
  ArticleDeliveryNoteEntry,
  CreateDeliveryNoteDto,
  DuplicateDeliveryNoteDto,
  PagedDeliveryNote,
  DELIVERY_NOTE_STATUS,
  DeliveryNote,
  DeliveryNoteUploadedFile,
  ToastValidation,
  UpdateDeliveryNoteDto,
  UpdateDeliveryNoteSequentialNumber
} from '@/types';
import { DELIVERY_NOTE_FILTER_ATTRIBUTES } from '@/constants/delivery-note.filter-attributes';
import { createDocumentApi } from './utils/document-api-factory';

const baseApi = createDocumentApi<DeliveryNote>({
  entityPath: 'deliveryNote',
  filterAttributes: DELIVERY_NOTE_FILTER_ATTRIBUTES,
  defaultListRelations: ['firm', 'interlocutor'],
  defaultFindOneRelations: [
    'firm', 'currency', 'bankAccount', 'interlocutor', 'firm.currency',
    'deliveryNoteMetaData', 'uploads', 'invoices', 'returnNotes', 'customerOrder', 'uploads.upload',
    'firm.deliveryAddress', 'firm.invoicingAddress',
    'articleDeliveryNoteEntries', 'firm.interlocutorsToFirm',
    'articleDeliveryNoteEntries.article',
    'articleDeliveryNoteEntries.articleDeliveryNoteEntryTaxes',
    'articleDeliveryNoteEntries.articleDeliveryNoteEntryTaxes.tax'
  ]
});

export interface FindPaginatedDeliveryNoteOptions {
  search?: string;
  relations?: string[];
  activityType?: ACTIVITY_TYPE;
  firmId?: number;
  interlocutorId?: number;
  status?: DELIVERY_NOTE_STATUS;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

const factory = (): CreateDeliveryNoteDto => {
  return {
    date: '',
    dueDate: '',
    activityType: ACTIVITY_TYPE.SELLING,
    reference: '',
    status: DELIVERY_NOTE_STATUS.Draft,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleDeliveryNoteEntries: [],
    deliveryNoteMetaData: {
      showDeliveryAddress: true,
      showInvoiceAddress: true,
      hasBankingDetails: true,
      hasGeneralConditions: true,
      showArticleDescription: true,
      showPrices: true,
      vehicleRegistration: '',
      driverName: '',
      taxSummary: []
    },
    quotationId: null,
    customerOrderId: null,
    invoiceId: null,
    files: []
  };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  searchOrOptions: string | FindPaginatedDeliveryNoteOptions = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedDeliveryNote> => {
  return baseApi.findPaginated(page, size, order, sortKey, searchOrOptions, relations, firmId, interlocutorId) as Promise<PagedDeliveryNote>;
};

const findChoices = async (
  status: DELIVERY_NOTE_STATUS,
  activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING
): Promise<DeliveryNote[]> => {
  const response = await axios.get<DeliveryNote[]>(
    `public/deliveryNote/all?filter=status||$eq||${status};activityType||$eq||${activityType}`
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations?: string[]
): Promise<DeliveryNote & { files: DeliveryNoteUploadedFile[] }> => {
  const data = await baseApi.findOne(id, relations) as DeliveryNote;
  return { ...data, files: await baseApi.getUploads(data) as DeliveryNoteUploadedFile[] };
};

const create = async (deliveryNote: CreateDeliveryNoteDto, files: File[]): Promise<DeliveryNote> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.post<DeliveryNote>('public/deliveryNote', {
    ...deliveryNote,
    activityType: deliveryNote.activityType || ACTIVITY_TYPE.SELLING,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const { preview, download, sendEmail, duplicate } = baseApi;

const update = async (deliveryNote: UpdateDeliveryNoteDto, files: File[]): Promise<DeliveryNote> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.put<DeliveryNote>(`public/deliveryNote/${deliveryNote.id}`, {
    ...deliveryNote,
    activityType: deliveryNote.activityType || ACTIVITY_TYPE.SELLING,
    uploads: [
      ...(deliveryNote.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return response.data;
};

const updateStatus = async (id: number, status: DELIVERY_NOTE_STATUS): Promise<DeliveryNote> => {
  const response = await axios.put<DeliveryNote>(`public/deliveryNote/${id}/status`, { status });
  return response.data;
};

const validateStatus = async (id: number): Promise<DeliveryNote> => {
  const response = await axios.post<DeliveryNote>(`public/deliveryNote/${id}/validate`);
  return response.data;
};

const deliverStatus = async (id: number): Promise<DeliveryNote> => {
  const response = await axios.post<DeliveryNote>(`public/deliveryNote/${id}/deliver`);
  return response.data;
};

const cancelStatus = async (id: number): Promise<DeliveryNote> => {
  const response = await axios.post<DeliveryNote>(`public/deliveryNote/${id}/cancel`);
  return response.data;
};

const invoice = async (id?: number, createInvoice?: boolean): Promise<DeliveryNote> => {
  const response = await axios.put<DeliveryNote>(`public/deliveryNote/invoice/${id}/${createInvoice}`);
  return response.data;
};

const remove = async (id: number): Promise<DeliveryNote> => {
  return baseApi.remove(id) as Promise<DeliveryNote>;
};

const validate = (deliveryNote: Partial<DeliveryNote>): ToastValidation => {
  if (!deliveryNote.date) return { message: 'La date est obligatoire' };
  if (!deliveryNote.dueDate) return { message: "L'échéance est obligatoire" };
  if (deliveryNote.activityType === ACTIVITY_TYPE.BUYING && !deliveryNote.reference?.trim()) {
    return { message: 'La référence du bon de réception est obligatoire' };
  }
  if (!deliveryNote.object) return { message: "L'objet est obligatoire" };
  if (differenceInDays(new Date(deliveryNote.date), new Date(deliveryNote.dueDate)) >= 0)
    return { message: "L'échéance doit être supérieure à la date" };
  if (!deliveryNote.firmId || !deliveryNote.interlocutorId)
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  if (!deliveryNote.articleDeliveryNoteEntries?.length)
    return { message: 'Veuillez ajouter au moins un article' };
  return { message: '' };
};

const updateDeliveryNotesSequentials = async (updatedSequenceDto: UpdateDeliveryNoteSequentialNumber) => {
  const response = await axios.put<DeliveryNote>(
    `public/deliveryNote/update-delivery-note-sequences`,
    updatedSequenceDto
  );
  return response.data;
};

export const deliveryNote = {
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
  validateStatus,
  deliverStatus,
  cancelStatus,
  updateDeliveryNotesSequentials,
  remove,
  validate,
  saveFromQuotation: async (id: number): Promise<DeliveryNote> => {
    const response = await axios.post<DeliveryNote>(`public/deliveryNote/from-quotation/${id}`);
    return response.data;
  },
  saveFromInvoice: async (id: number): Promise<DeliveryNote> => {
    const response = await axios.post<DeliveryNote>(`public/deliveryNote/from-invoice/${id}`);
    return response.data;
  },
  saveFromCustomerOrder: async (id: number): Promise<DeliveryNote> => {
    const response = await axios.post<DeliveryNote>(`public/deliveryNote/from-customer-order/${id}`);
    return response.data;
  }
};

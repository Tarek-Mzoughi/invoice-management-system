import axios from './axios';
import { differenceInDays } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import {
  ACTIVITY_TYPE,
  ArticleReturnNoteEntry,
  CreateReturnNoteDto,
  DateRange,
  DuplicateReturnNoteDto,
  PagedReturnNote,
  RETURN_NOTE_STATUS,
  ReturnNote,
  ReturnNoteUploadedFile,
  ToastValidation,
  UpdateReturnNoteDto,
  UpdateReturnNoteSequentialNumber
} from '@/types';
import { RETURN_NOTE_FILTER_ATTRIBUTES } from '@/constants/return-note.filter-attributes';
import { createDocumentApi } from './utils/document-api-factory';
import { validateDocumentDateRange } from './utils/document-date-validation';

const baseApi = createDocumentApi<ReturnNote>({
  entityPath: 'returnNote',
  filterAttributes: RETURN_NOTE_FILTER_ATTRIBUTES,
  defaultListRelations: ['firm', 'interlocutor'],
  defaultFindOneRelations: [
    'firm',
    'currency',
    'bankAccount',
    'interlocutor',
    'firm.currency',
    'returnNoteMetaData',
    'uploads',
    'invoices',
    'uploads.upload',
    'firm.deliveryAddress',
    'firm.invoicingAddress',
    'articleReturnNoteEntries',
    'firm.interlocutorsToFirm',
    'articleReturnNoteEntries.article',
    'articleReturnNoteEntries.articleReturnNoteEntryTaxes',
    'articleReturnNoteEntries.articleReturnNoteEntryTaxes.tax'
  ]
});

export interface FindPaginatedReturnNoteOptions {
  search?: string;
  relations?: string[];
  activityType?: ACTIVITY_TYPE;
  firmId?: number;
  interlocutorId?: number;
  status?: RETURN_NOTE_STATUS;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

const factory = (): CreateReturnNoteDto => {
  return {
    date: '',
    dueDate: '',
    activityType: ACTIVITY_TYPE.SELLING,
    reference: '',
    status: RETURN_NOTE_STATUS.Draft,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleReturnNoteEntries: [],
    returnNoteMetaData: {
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
    files: []
  };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  searchOrOptions: string | FindPaginatedReturnNoteOptions = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedReturnNote> => {
  return baseApi.findPaginated(
    page,
    size,
    order,
    sortKey,
    searchOrOptions,
    relations,
    firmId,
    interlocutorId
  ) as Promise<PagedReturnNote>;
};

const findChoices = async (
  status: RETURN_NOTE_STATUS,
  activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING
): Promise<ReturnNote[]> => {
  const response = await axios.get<ReturnNote[]>(
    `public/returnNote/all?filter=status||$eq||${status};activityType||$eq||${activityType}`
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations?: string[]
): Promise<ReturnNote & { files: ReturnNoteUploadedFile[] }> => {
  const data = (await baseApi.findOne(id, relations)) as ReturnNote;
  return { ...data, files: (await baseApi.getUploads(data)) as ReturnNoteUploadedFile[] };
};

const findByRange = async (
  id?: number
): Promise<{ previous?: { date?: string }; next?: { date?: string } }> => {
  const response = await axios.get<{ previous?: { date?: string }; next?: { date?: string } }>(
    `public/returnNote/sequential-range/${id}`
  );
  return response.data;
};

const create = async (returnNote: CreateReturnNoteDto, files: File[]): Promise<ReturnNote> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.post<ReturnNote>('public/returnNote', {
    ...returnNote,
    activityType: returnNote.activityType || ACTIVITY_TYPE.SELLING,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const { preview, download, sendEmail, duplicate } = baseApi;

const update = async (returnNote: UpdateReturnNoteDto, files: File[]): Promise<ReturnNote> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.put<ReturnNote>(`public/returnNote/${returnNote.id}`, {
    ...returnNote,
    activityType: returnNote.activityType || ACTIVITY_TYPE.SELLING,
    uploads: [
      ...(returnNote.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return response.data;
};

const invoice = async (id?: number, createInvoice?: boolean): Promise<ReturnNote> => {
  const response = await axios.put<ReturnNote>(`public/returnNote/invoice/${id}/${createInvoice}`);
  return response.data;
};

const remove = async (id: number): Promise<ReturnNote> => {
  return baseApi.remove(id) as Promise<ReturnNote>;
};

const validate = (returnNote: Partial<ReturnNote>, dateRange?: DateRange): ToastValidation => {
  if (!returnNote.date) return { message: 'La date est obligatoire' };

  const returnNoteDate = new Date(returnNote.date);
  const dateRangeError = validateDocumentDateRange(returnNoteDate, dateRange);
  if (dateRangeError) return { message: dateRangeError };

  if (!returnNote.dueDate) return { message: "L'échéance est obligatoire" };
  if (returnNote.activityType === ACTIVITY_TYPE.BUYING && !returnNote.reference?.trim()) {
    return { message: 'La référence du bon de retour fournisseur est obligatoire' };
  }
  if (!returnNote.object) return { message: "L'objet est obligatoire" };
  if (differenceInDays(returnNoteDate, new Date(returnNote.dueDate)) > 0)
    return { message: "L'échéance doit être supérieure ou égale à la date" };
  if (!returnNote.firmId || !returnNote.interlocutorId)
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  if (!returnNote.articleReturnNoteEntries?.length)
    return { message: 'Veuillez ajouter au moins un article' };
  return { message: '' };
};

const updateReturnNotesSequentials = async (
  updatedSequenceDto: UpdateReturnNoteSequentialNumber
) => {
  const response = await axios.put<ReturnNote>(
    `/public/returnNote/update-returnNote-sequences`,
    updatedSequenceDto
  );
  return response.data;
};

export const returnNote = {
  factory,
  findPaginated,
  findOne,
  findByRange,
  findChoices,
  create,
  preview,
  download,
  sendEmail,
  invoice,
  duplicate,
  update,
  updateReturnNotesSequentials,
  remove,
  validate,
  saveFromInvoice: async (id: number): Promise<ReturnNote> => {
    const response = await axios.post<ReturnNote>(`public/returnNote/from-invoice/${id}`);
    return response.data;
  },
  saveFromDeliveryNote: async (id: number): Promise<ReturnNote> => {
    const response = await axios.post<ReturnNote>(`public/returnNote/from-delivery-note/${id}`);
    return response.data;
  },
  saveFromGoodsIssueNote: async (id: number): Promise<ReturnNote> => {
    const response = await axios.post<ReturnNote>(`public/returnNote/from-goods-issue-note/${id}`);
    return response.data;
  }
};

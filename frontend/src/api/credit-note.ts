import axios from './axios';
import { differenceInDays } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import {
  ACTIVITY_TYPE,
  ArticleCreditNoteEntry,
  CreateCreditNoteDto,
  DateRange,
  DuplicateCreditNoteDto,
  PagedCreditNote,
  CREDIT_NOTE_STATUS,
  CreditNote,
  CreditNoteUploadedFile,
  ToastValidation,
  UpdateCreditNoteDto,
  UpdateCreditNoteSequentialNumber
} from '@/types';
import { CREDIT_NOTE_FILTER_ATTRIBUTES } from '@/constants/credit-note.filter-attributes';
import { createDocumentApi } from './utils/document-api-factory';
import { validateDocumentDateRange } from './utils/document-date-validation';

const baseApi = createDocumentApi<CreditNote>({
  entityPath: 'creditNote',
  filterAttributes: CREDIT_NOTE_FILTER_ATTRIBUTES,
  defaultListRelations: ['firm', 'interlocutor'],
  defaultFindOneRelations: [
    'firm',
    'currency',
    'bankAccount',
    'interlocutor',
    'firm.currency',
    'creditNoteMetaData',
    'uploads',
    'uploads.upload',
    'sourceInvoice',
    'sourceReturnNote',
    'quotation',
    'deliveryNote',
    'goodsIssueNote',
    'payments',
    'payments.payment',
    'payments.payment.currency',
    'firm.deliveryAddress',
    'firm.invoicingAddress',
    'articleCreditNoteEntries',
    'firm.interlocutorsToFirm',
    'articleCreditNoteEntries.article',
    'articleCreditNoteEntries.articleCreditNoteEntryTaxes',
    'articleCreditNoteEntries.articleCreditNoteEntryTaxes.tax'
  ]
});

export interface FindPaginatedCreditNoteOptions {
  search?: string;
  relations?: string[];
  activityType?: ACTIVITY_TYPE;
  firmId?: number;
  interlocutorId?: number;
  status?: CREDIT_NOTE_STATUS;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

const normalizeSellingCreditNoteStatus = (
  creditNote?: CreditNote | null
): CreditNote | null | undefined => {
  if (!creditNote) {
    return creditNote;
  }

  if (
    creditNote.activityType === ACTIVITY_TYPE.SELLING &&
    creditNote.status &&
    [CREDIT_NOTE_STATUS.Validated, CREDIT_NOTE_STATUS.Sent].includes(creditNote.status)
  ) {
    return {
      ...creditNote,
      status: CREDIT_NOTE_STATUS.Unpaid
    };
  }

  return creditNote;
};

const normalizePagedCreditNotes = (paged: PagedCreditNote): PagedCreditNote => ({
  ...paged,
  data: (paged.data || []).map(
    (creditNote) => normalizeSellingCreditNoteStatus(creditNote) as CreditNote
  )
});

const factory = (): CreateCreditNoteDto => {
  return {
    date: '',
    dueDate: '',
    activityType: ACTIVITY_TYPE.SELLING,
    status: CREDIT_NOTE_STATUS.Draft,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleCreditNoteEntries: [],
    creditNoteMetaData: {
      showDeliveryAddress: true,
      showInvoiceAddress: true,
      showCreditNoteAddress: true,
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
  searchOrOptions: string | FindPaginatedCreditNoteOptions = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedCreditNote> => {
  const paged = await (baseApi.findPaginated(
    page,
    size,
    order,
    sortKey,
    searchOrOptions,
    relations,
    firmId,
    interlocutorId
  ) as Promise<PagedCreditNote>);
  return normalizePagedCreditNotes(paged);
};

const findChoices = async (
  status: CREDIT_NOTE_STATUS,
  activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING
): Promise<CreditNote[]> => {
  const response = await axios.get<CreditNote[]>(
    `public/creditNote/all?filter=status||$eq||${status};activityType||$eq||${activityType}`
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations?: string[]
): Promise<CreditNote & { files: CreditNoteUploadedFile[] }> => {
  const data = normalizeSellingCreditNoteStatus(
    (await baseApi.findOne(id, relations)) as CreditNote
  ) as CreditNote;
  return { ...data, files: (await baseApi.getUploads(data)) as CreditNoteUploadedFile[] };
};

const findByRange = async (
  id?: number
): Promise<{ previous?: { date?: string }; next?: { date?: string } }> => {
  const response = await axios.get<{ previous?: { date?: string }; next?: { date?: string } }>(
    `public/creditNote/sequential-range/${id}`
  );
  return response.data;
};

const create = async (creditNote: CreateCreditNoteDto, files: File[]): Promise<CreditNote> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.post<CreditNote>('public/creditNote', {
    ...creditNote,
    activityType: creditNote.activityType || ACTIVITY_TYPE.SELLING,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return normalizeSellingCreditNoteStatus(response.data) as CreditNote;
};

const { preview, download, sendEmail, duplicate } = baseApi;

const update = async (creditNote: UpdateCreditNoteDto, files: File[]): Promise<CreditNote> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.put<CreditNote>(`public/creditNote/${creditNote.id}`, {
    ...creditNote,
    activityType: creditNote.activityType || ACTIVITY_TYPE.SELLING,
    uploads: [
      ...(creditNote.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return normalizeSellingCreditNoteStatus(response.data) as CreditNote;
};

const remove = async (id: number): Promise<CreditNote> => {
  return baseApi.remove(id) as Promise<CreditNote>;
};

const validate = (creditNote: Partial<CreditNote>, dateRange?: DateRange): ToastValidation => {
  if (!creditNote.date) return { message: 'La date est obligatoire' };
  const creditNoteDate = new Date(creditNote.date);
  const dateRangeError = validateDocumentDateRange(creditNoteDate, dateRange);
  if (dateRangeError) return { message: dateRangeError };
  if (!creditNote.dueDate) return { message: "L'échéance est obligatoire" };
  if (creditNote.activityType === ACTIVITY_TYPE.BUYING && !creditNote.reference?.trim()) {
    return { message: "La référence de la facture d'achat est obligatoire" };
  }
  if (!creditNote.object) return { message: "L'objet est obligatoire" };
  const dueDate = new Date(creditNote.dueDate);
  if (differenceInDays(creditNoteDate, dueDate) > 0) {
    return { message: "L'échéance doit être supérieure ou égale à la date" };
  }
  if (!creditNote.firmId || !creditNote.interlocutorId) {
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  }
  if (!creditNote.articleCreditNoteEntries?.length) {
    return { message: 'Veuillez ajouter au moins un article' };
  }
  return { message: '' };
};

const updateCreditNotesSequentials = async (
  updatedSequenceDto: UpdateCreditNoteSequentialNumber
) => {
  const response = await axios.put<CreditNote>(
    `public/creditNote/update-credit-note-sequences`,
    updatedSequenceDto
  );
  return response.data;
};

export const creditNote = {
  factory,
  findPaginated,
  findOne,
  findByRange,
  findChoices,
  create,
  preview,
  download,
  sendEmail,
  duplicate,
  update,
  updateCreditNotesSequentials,
  remove,
  validate,
  saveFromInvoice: async (id: number): Promise<CreditNote> => {
    const response = await axios.post<CreditNote>(`public/creditNote/from-invoice/${id}`);
    return response.data;
  },
  saveFromReturnNote: async (id: number): Promise<CreditNote> => {
    const response = await axios.post<CreditNote>(`public/creditNote/from-return-note/${id}`);
    return response.data;
  }
};

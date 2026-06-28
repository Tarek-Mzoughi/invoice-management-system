import axios from './axios';
import { differenceInDays } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import {
  ACTIVITY_TYPE,
  ArticleGoodsIssueNoteEntry,
  CreateGoodsIssueNoteDto,
  DuplicateGoodsIssueNoteDto,
  PagedGoodsIssueNote,
  GOODS_ISSUE_NOTE_STATUS,
  GoodsIssueNote,
  GoodsIssueNoteUploadedFile,
  ToastValidation,
  UpdateGoodsIssueNoteDto,
  UpdateGoodsIssueNoteSequentialNumber
} from '@/types';
import { GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES } from '@/constants/goods-issue-note.filter-attributes';
import { createDocumentApi } from './utils/document-api-factory';

const baseApi = createDocumentApi<GoodsIssueNote>({
  entityPath: 'goodsIssueNote',
  filterAttributes: GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES,
  defaultListRelations: ['firm', 'interlocutor'],
  defaultFindOneRelations: [
    'firm', 'currency', 'bankAccount', 'interlocutor', 'firm.currency',
    'goodsIssueNoteMetaData', 'uploads', 'invoices', 'uploads.upload',
    'firm.deliveryAddress', 'firm.invoicingAddress',
    'articleGoodsIssueNoteEntries', 'firm.interlocutorsToFirm',
    'articleGoodsIssueNoteEntries.article',
    'articleGoodsIssueNoteEntries.articleGoodsIssueNoteEntryTaxes',
    'articleGoodsIssueNoteEntries.articleGoodsIssueNoteEntryTaxes.tax'
  ]
});

export interface FindPaginatedGoodsIssueNoteOptions {
  search?: string;
  relations?: string[];
  activityType?: ACTIVITY_TYPE;
  firmId?: number;
  interlocutorId?: number;
  status?: GOODS_ISSUE_NOTE_STATUS;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

const factory = (): CreateGoodsIssueNoteDto => {
  return {
    date: '',
    dueDate: '',
    activityType: ACTIVITY_TYPE.SELLING,
    status: GOODS_ISSUE_NOTE_STATUS.Draft,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleGoodsIssueNoteEntries: [],
    goodsIssueNoteMetaData: {
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
    invoiceId: null,
    files: []
  };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  searchOrOptions: string | FindPaginatedGoodsIssueNoteOptions = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedGoodsIssueNote> => {
  return baseApi.findPaginated(page, size, order, sortKey, searchOrOptions, relations, firmId, interlocutorId) as Promise<PagedGoodsIssueNote>;
};

const findChoices = async (
  status: GOODS_ISSUE_NOTE_STATUS,
  activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING
): Promise<GoodsIssueNote[]> => {
  const response = await axios.get<GoodsIssueNote[]>(
    `public/goodsIssueNote/all?filter=status||$eq||${status};activityType||$eq||${activityType}`
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations?: string[]
): Promise<GoodsIssueNote & { files: GoodsIssueNoteUploadedFile[] }> => {
  const data = await baseApi.findOne(id, relations) as GoodsIssueNote;
  return { ...data, files: await baseApi.getUploads(data) as GoodsIssueNoteUploadedFile[] };
};

const create = async (goodsIssueNote: CreateGoodsIssueNoteDto, files: File[]): Promise<GoodsIssueNote> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.post<GoodsIssueNote>('public/goodsIssueNote', {
    ...goodsIssueNote,
    activityType: goodsIssueNote.activityType || ACTIVITY_TYPE.SELLING,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const { preview, download, sendEmail, duplicate } = baseApi;

const update = async (goodsIssueNote: UpdateGoodsIssueNoteDto, files: File[]): Promise<GoodsIssueNote> => {
  const uploadIds = await baseApi.uploadFiles(files);
  const response = await axios.put<GoodsIssueNote>(`public/goodsIssueNote/${goodsIssueNote.id}`, {
    ...goodsIssueNote,
    activityType: goodsIssueNote.activityType || ACTIVITY_TYPE.SELLING,
    uploads: [
      ...(goodsIssueNote.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return response.data;
};

const updateStatus = async (
  id: number,
  status: GOODS_ISSUE_NOTE_STATUS
): Promise<GoodsIssueNote> => {
  const response = await axios.put<GoodsIssueNote>(`public/goodsIssueNote/${id}/status`, {
    status
  });
  return response.data;
};

const remove = async (id: number): Promise<GoodsIssueNote> => {
  return baseApi.remove(id) as Promise<GoodsIssueNote>;
};

const validate = (goodsIssueNote: Partial<GoodsIssueNote>): ToastValidation => {
  if (!goodsIssueNote.date) return { message: 'La date est obligatoire' };
  if (!goodsIssueNote.dueDate) return { message: "L'échéance est obligatoire" };
  if (!goodsIssueNote.object) return { message: "L'objet est obligatoire" };
  if (differenceInDays(new Date(goodsIssueNote.date), new Date(goodsIssueNote.dueDate)) >= 0)
    return { message: "L'échéance doit être supérieure à la date" };
  if (!goodsIssueNote.firmId || !goodsIssueNote.interlocutorId)
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  if (!goodsIssueNote.articleGoodsIssueNoteEntries?.length)
    return { message: 'Veuillez ajouter au moins un article' };
  return { message: '' };
};

const updateGoodsIssueNotesSequentials = async (updatedSequenceDto: UpdateGoodsIssueNoteSequentialNumber) => {
  const response = await axios.put<GoodsIssueNote>(
    `/public/goodsIssueNote/update-goodsIssueNote-sequences`,
    updatedSequenceDto
  );
  return response.data;
};

export const goodsIssueNote = {
  factory,
  findPaginated,
  findOne,
  findChoices,
  create,
  preview,
  download,
  sendEmail,
  duplicate,
  update,
  updateStatus,
  updateGoodsIssueNotesSequentials,
  remove,
  validate,
  saveFromQuotation: async (id: number): Promise<GoodsIssueNote> => {
    const response = await axios.post<GoodsIssueNote>(`public/goodsIssueNote/from-quotation/${id}`);
    return response.data;
  },
  saveFromDeliveryNote: async (id: number): Promise<GoodsIssueNote> => {
    const response = await axios.post<GoodsIssueNote>(`public/goodsIssueNote/from-delivery-note/${id}`);
    return response.data;
  },
  saveFromCustomerOrder: async (id: number): Promise<GoodsIssueNote> => {
    void id;
    throw new Error('customerOrder.errors.goods_issue_note_not_supported');
  }
};

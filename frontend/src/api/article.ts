import { ARTICLE_FILTER_ATTRIBUTES } from '@/constants/article.filter-attributes';
import {
  Article,
  ArticleQuotationEntry,
  CreateArticleDto,
  PagedArticle,
  ToastValidation,
  UpdateArticleDto
} from '@/types';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import axios from './axios';
import type { ApiRequestOptions } from './request-options';
import { upload } from './upload';

export interface FindPaginatedArticleOptions {
  search?: string;
  destination?: Article['destination'] | 'all';
  articleType?: Article['articleType'] | 'all';
  family?: string;
  subFamily?: string;
  brand?: string;
}

const factory = (): ArticleQuotationEntry => {
  return {
    article: { title: '', description: '' },
    unit_price: 0,
    quantity: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.PERCENTAGE,
    articleQuotationEntryTaxes: [],
    total: 0
  };
};

const factoryEntity = (): CreateArticleDto => ({
  title: '',
  reference: '',
  destination: 'selling',
  articleType: 'product',
  description: '',
  image: undefined,
  imageId: undefined,
  salePrice: 0,
  purchasePrice: 0,
  productionCost: 0,
  taxIds: [],
  additionalTaxIds: [],
  unit: '',
  family: '',
  subFamily: '',
  brand: '',
  priceListName: '',
  priceListId: undefined,
  barcode: '',
  privateNotes: '',
  attachments: [],
  attachmentIds: [],
  discountEnabled: false,
  discountValue: 0,
  discountType: 'percentage'
});

const normalizeArticle = (article: Article): Article => ({
  ...article,
  salePrice: typeof article.salePrice === 'string' ? Number(article.salePrice) : article.salePrice,
  purchasePrice:
    typeof article.purchasePrice === 'string' ? Number(article.purchasePrice) : article.purchasePrice,
  productionCost:
    typeof article.productionCost === 'string' ? Number(article.productionCost) : article.productionCost,
  discountValue:
    typeof article.discountValue === 'string' ? Number(article.discountValue) : article.discountValue,
  taxIds: article.taxIds || [],
  additionalTaxIds: article.additionalTaxIds || [],
  attachmentIds: article.attachmentIds || [],
  attachments: article.attachments || []
});

const buildArticleFilters = ({
  search = '',
  destination,
  articleType,
  family,
  subFamily,
  brand
}: FindPaginatedArticleOptions) => {
  const andConditions = [
    destination && destination !== 'all'
      ? `${ARTICLE_FILTER_ATTRIBUTES.DESTINATION}||$eq||${destination}`
      : '',
    articleType && articleType !== 'all'
      ? `${ARTICLE_FILTER_ATTRIBUTES.ARTICLE_TYPE}||$eq||${articleType}`
      : '',
    family && family !== 'all' ? `${ARTICLE_FILTER_ATTRIBUTES.FAMILY}||$eq||${family}` : '',
    subFamily && subFamily !== 'all'
      ? `${ARTICLE_FILTER_ATTRIBUTES.SUB_FAMILY}||$eq||${subFamily}`
      : '',
    brand && brand !== 'all' ? `${ARTICLE_FILTER_ATTRIBUTES.BRAND}||$eq||${brand}` : ''
  ].filter(Boolean);

  const trimmedSearch = search.trim();
  if (!trimmedSearch) {
    return andConditions.join(';');
  }

  return [
    ARTICLE_FILTER_ATTRIBUTES.TITLE,
    ARTICLE_FILTER_ATTRIBUTES.REFERENCE,
    ARTICLE_FILTER_ATTRIBUTES.DESCRIPTION
  ]
    .map((attribute) =>
      [`${attribute}||$cont||${trimmedSearch}`, ...andConditions].filter(Boolean).join(';')
    )
    .join('||$or||');
};

const findPaginated = async (
  page: number = 1,
  size: number = 20,
  order: 'ASC' | 'DESC' = 'DESC',
  sortKey: string = 'createdAt',
  options: FindPaginatedArticleOptions = {}
): Promise<PagedArticle> => {
  const params = new URLSearchParams({
    sort: `${sortKey},${order}`,
    limit: size.toString(),
    page: page.toString()
  });

  const filter = buildArticleFilters(options);
  if (filter) {
    params.set('filter', filter);
  }

  const response = await axios.get<PagedArticle>(`public/article/list?${params.toString()}`);
  return {
    ...response.data,
    data: response.data.data.map(normalizeArticle)
  };
};

const findAll = async (options: ApiRequestOptions = {}): Promise<Article[]> => {
  const response = await axios.get<Article[]>('public/article/all', {
    silentForbiddenToast: options.silentForbiddenToast
  });
  return response.data.map(normalizeArticle);
};

const findDocumentChoices = async (
  activityType: 'selling' | 'buying',
  options: ApiRequestOptions = {}
): Promise<Article[]> => {
  const params = new URLSearchParams({
    activityType
  });


  const response = await axios.get<Article[]>(
    `public/article/document-choices?${params.toString()}`,
    {
      silentForbiddenToast: options.silentForbiddenToast
    }
  );
  return response.data.map(normalizeArticle);
};

const findOne = async (id?: number): Promise<Article> => {
  const response = await axios.get<Article>(`public/article/${id}`);
  return normalizeArticle(response.data);
};

const create = async (articleToCreate: CreateArticleDto): Promise<Article> => {
  const imageId = articleToCreate.image
    ? (await upload.uploadFile(articleToCreate.image)).id
    : articleToCreate.imageId;
  const uploadedAttachmentIds = articleToCreate.attachments?.length
    ? await upload.uploadFiles(articleToCreate.attachments)
    : [];

  const { image, attachments, ...payload } = articleToCreate;
  const response = await axios.post<Article>('public/article', {
    ...payload,
    imageId: imageId || null,
    attachmentIds: [...(payload.attachmentIds || []), ...uploadedAttachmentIds]
  });

  return normalizeArticle(response.data);
};

const update = async (articleToUpdate: UpdateArticleDto): Promise<Article> => {
  const imageId = articleToUpdate.image
    ? (await upload.uploadFile(articleToUpdate.image)).id
    : articleToUpdate.imageId;
  const uploadedAttachmentIds = articleToUpdate.attachments?.length
    ? await upload.uploadFiles(articleToUpdate.attachments)
    : [];

  const { image, attachments, ...payload } = articleToUpdate;
  const response = await axios.put<Article>(`public/article/${articleToUpdate.id}`, {
    ...payload,
    imageId: imageId || null,
    attachmentIds: [...(payload.attachmentIds || []), ...uploadedAttachmentIds]
  });

  return normalizeArticle(response.data);
};

const remove = async (id?: number) => {
  const { data, status } = await axios.delete<Article>(`public/article/${id}`);
  return { data, status };
};

const validate = (articleToValidate: CreateArticleDto | UpdateArticleDto): ToastValidation => {
  if (!articleToValidate.title?.trim()) {
    return { message: 'articles.errors.title_required' };
  }

  if (!articleToValidate.destination) {
    return { message: 'articles.errors.destination_required' };
  }

  if (!articleToValidate.articleType) {
    return { message: 'articles.errors.type_required' };
  }

  if (
    articleToValidate.discountEnabled &&
    typeof articleToValidate.discountValue === 'number' &&
    articleToValidate.discountValue < 0
  ) {
    return { message: 'articles.errors.discount_value_invalid' };
  }

  return { message: '' };
};

export const article = {
  factory,
  factoryEntity,
  findPaginated,
  findAll,
  findDocumentChoices,
  findOne,
  create,
  update,
  remove,
  validate
};

import { Article, ArticleDiscountType, ArticleType, CreateArticleDto } from '@/types';
import { create } from 'zustand';

type ArticleManager = {
  id?: number;
  title?: string;
  reference?: string;
  destination?: Article['destination'];
  articleType?: ArticleType;
  description?: string;
  image?: File;
  imageId?: number;
  salePrice?: number;
  purchasePrice?: number;
  productionCost?: number;
  taxIds: number[];
  additionalTaxIds: number[];
  unit?: string;
  family?: string;
  subFamily?: string;
  brand?: string;
  priceListName?: string;
  priceListId?: number;
  priceListPrices: Array<{
    priceListId: number;
    type: 'fixed' | 'percentage';
    salePrice: number;
    purchasePrice: number;
  }>;
  barcode?: string;
  privateNotes?: string;
  attachments: File[];
  attachmentIds: number[];
  discountEnabled?: boolean;
  discountValue?: number;
  discountType?: ArticleDiscountType;
  set: (name: keyof ArticleManager, value: any) => void;
  reset: () => void;
  setArticle: (article: Partial<Article>) => void;
  getArticle: () => Partial<Article>;
};

const initialState: Omit<ArticleManager, 'set' | 'reset' | 'setArticle' | 'getArticle'> = {
  id: undefined,
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
  priceListPrices: [],
  barcode: '',
  privateNotes: '',
  attachments: [],
  attachmentIds: [],
  discountEnabled: false,
  discountValue: 0,
  discountType: 'percentage'
};

export const useArticleManager = create<ArticleManager>((set, get) => ({
  ...initialState,
  set: (name: keyof ArticleManager, value: any) => {
    set((state) => ({
      ...state,
      [name]: value
    }));
  },
  reset: () => {
    set({ ...initialState });
  },
  setArticle: (article: Partial<Article>) => {
    set((state) => ({
      ...state,
      id: article.id,
      title: article.title || '',
      reference: article.reference || '',
      destination: article.destination || 'selling',
      articleType: article.articleType || 'product',
      description: article.description || '',
      image: undefined,
      imageId: article.imageId,
      salePrice: Number(article.salePrice || 0),
      purchasePrice: Number(article.purchasePrice || 0),
      productionCost: Number(article.productionCost || 0),
      taxIds: article.taxIds || [],
      additionalTaxIds: article.additionalTaxIds || [],
      unit: article.unit || '',
      family: article.family || '',
      subFamily: article.subFamily || '',
      brand: article.brand || '',
      priceListName: article.priceListName || '',
      priceListId: article.priceListId,
      priceListPrices: article.priceListPrices || [],
      barcode: article.barcode || '',
      privateNotes: article.privateNotes || '',
      attachments: [],
      attachmentIds: article.attachmentIds || [],
      discountEnabled: article.discountEnabled ?? false,
      discountValue: Number(article.discountValue || 0),
      discountType: article.discountType || 'percentage'
    }));
  },
  getArticle: () => {
    const { set, reset, setArticle, getArticle, ...data } = get();
    return {
      ...data,
      title: data.title?.trim(),
      reference: data.reference?.trim(),
      description: data.description?.trim(),
      unit: data.unit?.trim(),
      family: data.family?.trim(),
      subFamily: data.subFamily?.trim(),
      brand: data.brand?.trim(),
      priceListName: data.priceListName?.trim(),
      priceListId: data.priceListId,
      priceListPrices: data.priceListPrices,
      barcode: data.barcode?.trim(),
      privateNotes: data.privateNotes?.trim(),
      taxIds: data.taxIds,
      additionalTaxIds: data.additionalTaxIds,
      attachmentIds: data.attachmentIds,
      attachments: data.attachments.filter(Boolean)
    } as Partial<CreateArticleDto>;
  }
}));

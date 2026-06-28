import { DatabaseEntity } from './response/DatabaseEntity';
import { PagedResponse } from './response';

export type ArticleDestination = 'selling' | 'buying' | 'both';
export type ArticleType = 'product' | 'service' | 'asset';
export type ArticleDiscountType = 'percentage' | 'amount';

export interface Article extends DatabaseEntity {
  id?: number;
  title?: string;
  reference?: string;
  destination?: ArticleDestination;
  articleType?: ArticleType;
  description?: string;
  image?: File;
  imageId?: number;
  salePrice?: number;
  purchasePrice?: number;
  productionCost?: number;
  taxIds?: number[];
  additionalTaxIds?: number[];
  unit?: string;
  family?: string;
  subFamily?: string;
  brand?: string;
  priceListName?: string;
  priceListId?: number;
  priceListPrices?: Array<{
    priceListId: number;
    type: 'fixed' | 'percentage';
    salePrice: number;
    purchasePrice: number;
  }>;
  barcode?: string;
  privateNotes?: string;
  attachments?: File[];
  attachmentIds?: number[];
  discountEnabled?: boolean;
  discountValue?: number;
  discountType?: ArticleDiscountType;
}

export interface CreateArticleDto
  extends Omit<Article, 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDeletionRestricted'> {}

export interface UpdateArticleDto extends CreateArticleDto {
  id?: number;
}

export interface PagedArticle extends PagedResponse<Article> {}

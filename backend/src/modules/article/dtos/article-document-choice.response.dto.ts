import { ARTICLE_DESTINATION } from '../enums/article-destination.enum';
import { ARTICLE_DISCOUNT_TYPE } from '../enums/article-discount-type.enum';
import { ARTICLE_TYPE } from '../enums/article-type.enum';

export class ResponseArticleDocumentChoiceDto {
  id: number;
  title: string;
  label: string;
  reference?: string;
  description?: string;
  destination?: ARTICLE_DESTINATION;
  articleType?: ARTICLE_TYPE;
  salePrice?: number;
  purchasePrice?: number;
  unit?: string;
  taxIds?: number[];
  additionalTaxIds?: number[];
  discountEnabled?: boolean;
  discountValue?: number;
  discountType?: ARTICLE_DISCOUNT_TYPE;
}

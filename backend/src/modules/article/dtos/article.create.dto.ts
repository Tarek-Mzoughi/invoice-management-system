import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ARTICLE_DESTINATION } from '../enums/article-destination.enum';
import { ARTICLE_DISCOUNT_TYPE } from '../enums/article-discount-type.enum';
import { ARTICLE_TYPE } from '../enums/article-type.enum';

export class CreateArticleDto {
  @ApiProperty({ example: faker.commerce.product(), type: String })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: faker.string.alphanumeric(12),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ enum: ARTICLE_DESTINATION, required: false })
  @IsOptional()
  @IsEnum(ARTICLE_DESTINATION)
  destination?: ARTICLE_DESTINATION;

  @ApiProperty({ enum: ARTICLE_TYPE, required: false })
  @IsOptional()
  @IsEnum(ARTICLE_TYPE)
  articleType?: ARTICLE_TYPE;

  @ApiProperty({
    example: faker.commerce.productDescription(),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  imageId?: number;

  @ApiProperty({ example: 120.5, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salePrice?: number;

  @ApiProperty({ example: 80.5, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  purchasePrice?: number;

  @ApiProperty({ example: 65.25, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productionCost?: number;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  taxIds?: number[];

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  additionalTaxIds?: number[];

  @ApiProperty({ example: 'piece', type: String, required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 'Famille par défaut', type: String, required: false })
  @IsOptional()
  @IsString()
  family?: string;

  @ApiProperty({
    example: 'Sous-famille par défaut',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  subFamily?: string;

  @ApiProperty({ example: 'Marque par défaut', type: String, required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 'Liste standard', type: String, required: false })
  @IsOptional()
  @IsString()
  priceListName?: string;

  @ApiProperty({ example: 1, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priceListId?: number;

  @ApiProperty({ type: [Object], required: false })
  @IsOptional()
  @IsArray()
  priceListPrices?: Array<{
    priceListId: number;
    type: 'fixed' | 'percentage';
    salePrice: number;
    purchasePrice: number;
  }>;

  @ApiProperty({ example: '1234567890123', type: String, required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 'Notes privées', type: String, required: false })
  @IsOptional()
  @IsString()
  privateNotes?: string;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  attachmentIds?: number[];

  @ApiProperty({ example: false, type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  allowEmptyStock?: boolean;

  @ApiProperty({ example: false, type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  stockAlertEnabled?: boolean;

  @ApiProperty({ example: 5, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stockAlertThreshold?: number;

  @ApiProperty({ example: 12, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stockQuantity?: number;

  @ApiProperty({
    example: 'Entrepôt par défaut',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  defaultWarehouse?: string;

  @ApiProperty({ example: false, type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  discountEnabled?: boolean;

  @ApiProperty({ example: 10, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountValue?: number;

  @ApiProperty({ enum: ARTICLE_DISCOUNT_TYPE, required: false })
  @IsOptional()
  @IsEnum(ARTICLE_DISCOUNT_TYPE)
  discountType?: ARTICLE_DISCOUNT_TYPE;
}

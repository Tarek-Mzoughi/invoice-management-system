import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { CreateArticleDto } from 'src/modules/article/dtos/article.create.dto';

export class CreateArticleReturnNoteEntryDto {
  @ApiProperty({
    example: 1,
    type: Number,
    required: false,
    description: 'Legacy alias for articleId sent by the frontend selector',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiProperty({ example: 100.0, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unit_price?: number;

  @ApiProperty({ example: 2, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @ApiProperty({ example: 10, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount?: number;

  @ApiProperty({
    example: DISCOUNT_TYPES.PERCENTAGE,
    enum: DISCOUNT_TYPES,
    required: false,
  })
  @IsOptional()
  @IsEnum(DISCOUNT_TYPES)
  discount_type?: DISCOUNT_TYPES;

  @ApiProperty({ type: () => CreateArticleDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateArticleDto)
  article?: CreateArticleDto;

  @ApiProperty({ example: 1, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  articleId?: number;

  @ApiProperty({ example: 1, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  returnNoteId?: number;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  taxes?: number[];
}

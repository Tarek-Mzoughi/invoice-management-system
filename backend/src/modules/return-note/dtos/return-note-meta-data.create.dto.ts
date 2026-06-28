import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReturnNoteMetaDataDto {
  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean()
  @IsOptional()
  showInvoiceAddress?: boolean;

  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean()
  @IsOptional()
  showDeliveryAddress?: boolean;

  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean()
  @IsOptional()
  showArticleDescription?: boolean;

  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean()
  @IsOptional()
  showPrices?: boolean;

  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean()
  @IsOptional()
  hasBankingDetails?: boolean;

  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean()
  @IsOptional()
  hasGeneralConditions?: boolean;

  @ApiProperty({ example: '123 TUN 4567', type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  vehicleRegistration?: string;

  @ApiProperty({ example: 'Ahmed Ben Ali', type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  driverName?: string;

  @ApiProperty({ example: true, type: Object })
  @IsOptional()
  taxSummary?: any;
}

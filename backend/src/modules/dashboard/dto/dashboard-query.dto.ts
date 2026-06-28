import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DASHBOARD_PERIOD {
  TODAY = 'today',
  LAST_7_DAYS = 'last7Days',
  LAST_30_DAYS = 'last30Days',
  CURRENT_MONTH = 'currentMonth',
  CURRENT_YEAR = 'currentYear',
  CUSTOM = 'custom',
}

export enum DASHBOARD_DOCUMENT_TYPE {
  ALL = 'all',
  INVOICE = 'invoice',
  QUOTATION = 'quotation',
  PAYMENT = 'payment',
  CUSTOMER_ORDER = 'customerOrder',
  PURCHASE = 'purchase',
}

export class DashboardQueryDto {
  @ApiPropertyOptional({
    enum: DASHBOARD_PERIOD,
    default: DASHBOARD_PERIOD.CURRENT_YEAR,
  })
  @IsOptional()
  @IsEnum(DASHBOARD_PERIOD)
  period?: DASHBOARD_PERIOD = DASHBOARD_PERIOD.CURRENT_YEAR;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @ValidateIf((dto) => dto.period === DASHBOARD_PERIOD.CUSTOM)
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @ValidateIf((dto) => dto.period === DASHBOARD_PERIOD.CUSTOM)
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: DASHBOARD_DOCUMENT_TYPE,
    default: DASHBOARD_DOCUMENT_TYPE.ALL,
  })
  @IsOptional()
  @IsEnum(DASHBOARD_DOCUMENT_TYPE)
  documentType?: DASHBOARD_DOCUMENT_TYPE = DASHBOARD_DOCUMENT_TYPE.ALL;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currencyId?: number;

  @ApiPropertyOptional({ type: Number, default: 5, minimum: 3, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(10)
  topLimit?: number = 5;
}

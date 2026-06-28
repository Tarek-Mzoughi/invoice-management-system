import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/* ── Column / Table ────────────────────────────────────────────── */

export class AiTableColumnDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiPropertyOptional({
    enum: ['text', 'number', 'currency', 'date', 'status'],
  })
  type?: 'text' | 'number' | 'currency' | 'date' | 'status';

  @ApiPropertyOptional({ enum: ['left', 'center', 'right'] })
  align?: 'left' | 'center' | 'right';
}

export class AiTableTotalDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  currency?: string;
}

export class AiTablePayloadDto {
  @ApiProperty({ type: [AiTableColumnDto] })
  columns: AiTableColumnDto[];

  @ApiProperty({ type: [Object] })
  rows: Record<string, unknown>[];

  @ApiPropertyOptional({ type: [AiTableTotalDto] })
  totals?: AiTableTotalDto[];

  @ApiPropertyOptional()
  emptyMessage?: string;
}

/* ── Action Preview ────────────────────────────────────────────── */

export class AiActionCustomerDto {
  @ApiPropertyOptional()
  id?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;
}

export class AiActionDocumentDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  issueDate?: string;

  @ApiPropertyOptional()
  dueDate?: string;
}

export class AiActionItemDto {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional({ type: [String] })
  taxes?: string[];

  @ApiPropertyOptional()
  lineTotal?: number;
}

export class AiActionTotalsDto {
  @ApiPropertyOptional()
  subtotal?: number;

  @ApiPropertyOptional()
  taxTotal?: number;

  @ApiPropertyOptional()
  discountTotal?: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currency: string;
}

export class AiActionPreviewDataDto {
  @ApiPropertyOptional({ type: AiActionCustomerDto })
  customer?: AiActionCustomerDto;

  @ApiPropertyOptional({ type: AiActionDocumentDto })
  document?: AiActionDocumentDto;

  @ApiPropertyOptional({ type: [AiActionItemDto] })
  items?: AiActionItemDto[];

  @ApiPropertyOptional({ type: AiActionTotalsDto })
  totals?: AiActionTotalsDto;
}

export class AiActionPreviewDto {
  @ApiProperty()
  actionId: string;

  @ApiProperty()
  intent: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ default: true })
  confirmationRequired: boolean;

  @ApiProperty({ default: 'pending' })
  status: string;

  @ApiProperty({ type: AiActionPreviewDataDto })
  preview: AiActionPreviewDataDto;

  @ApiPropertyOptional({ type: [String] })
  warnings?: string[];
}

/* ── Chart ─────────────────────────────────────────────────────── */

export class AiChartResponseDto {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  chartType: string;

  @ApiProperty()
  echartsOption: Record<string, unknown>;

  @ApiPropertyOptional()
  sourceData?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  insights?: string[];
}

/* ── KPI ───────────────────────────────────────────────────────── */

export class AiKpiDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  previousValue?: number;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  trend?: 'up' | 'down' | 'stable';

  @ApiPropertyOptional()
  currency?: string;
}

/* ── Metadata ──────────────────────────────────────────────────── */

export class AiResponseMetadataDto {
  @ApiPropertyOptional()
  currency?: string;

  @ApiPropertyOptional()
  locale?: string;

  @ApiPropertyOptional()
  cabinetId?: string;

  @ApiPropertyOptional()
  source?: string;
}

/* ── Main Response ─────────────────────────────────────────────── */

export type AiResponseType =
  | 'text'
  | 'table'
  | 'chart'
  | 'action_preview'
  | 'kpi_summary'
  | 'invoice_analysis'
  | 'error'
  | 'clarification';

export class AiChatResponseDto {
  @ApiProperty({
    enum: [
      'text',
      'table',
      'chart',
      'action_preview',
      'kpi_summary',
      'invoice_analysis',
      'error',
      'clarification',
    ],
  })
  type: AiResponseType;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  conversationId?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  data?: unknown[];

  @ApiPropertyOptional({ type: AiTablePayloadDto })
  table?: AiTablePayloadDto;

  @ApiPropertyOptional({ type: AiChartResponseDto })
  chart?: AiChartResponseDto;

  @ApiPropertyOptional({ type: AiActionPreviewDto })
  action?: AiActionPreviewDto;

  @ApiPropertyOptional({ type: [AiKpiDto] })
  kpis?: AiKpiDto[];

  @ApiPropertyOptional({ type: [String] })
  warnings?: string[];

  @ApiPropertyOptional({ type: AiResponseMetadataDto })
  metadata?: AiResponseMetadataDto;
}

import { ApiProperty } from '@nestjs/swagger';

export class ResponseGoodsIssueNoteMetaDataDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({ example: true, type: Boolean })
  showInvoiceAddress: boolean;

  @ApiProperty({ example: true, type: Boolean })
  showDeliveryAddress: boolean;

  @ApiProperty({ example: true, type: Boolean })
  showArticleDescription: boolean;

  @ApiProperty({ example: true, type: Boolean })
  showPrices?: boolean;

  @ApiProperty({ example: true, type: Boolean })
  hasBankingDetails?: boolean;

  @ApiProperty({ example: true, type: Boolean })
  hasGeneralConditions?: boolean;

  @ApiProperty({ example: '123 TUN 4567', type: String, required: false })
  vehicleRegistration?: string;

  @ApiProperty({ example: 'Ahmed Ben Ali', type: String, required: false })
  driverName?: string;

  @ApiProperty({ example: {}, type: Object })
  taxSummary: any;
}

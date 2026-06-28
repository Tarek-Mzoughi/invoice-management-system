import { ApiProperty } from '@nestjs/swagger';

export class ResponseGoodsIssueNoteUploadDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({
    example: 1,
    type: Number,
  })
  goodsIssueNoteId?: number;

  @ApiProperty({
    example: 1,
    type: Number,
  })
  uploadId?: number;
}

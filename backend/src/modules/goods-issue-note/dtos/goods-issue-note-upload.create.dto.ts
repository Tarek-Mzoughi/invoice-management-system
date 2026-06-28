import { ApiProperty } from '@nestjs/swagger';

export class CreateGoodsIssueNoteUploadDto {
  @ApiProperty({
    example: 1,
    type: Number,
  })
  uploadId?: number;
}

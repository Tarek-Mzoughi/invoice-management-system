import { ApiProperty } from '@nestjs/swagger';

export class CreateCreditNoteUploadDto {
  @ApiProperty({
    example: 1,
    type: Number,
  })
  uploadId?: number;
}

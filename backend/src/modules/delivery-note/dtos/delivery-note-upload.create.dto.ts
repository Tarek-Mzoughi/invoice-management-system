import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliveryNoteUploadDto {
  @ApiProperty({
    example: 1,
    type: Number,
  })
  uploadId?: number;
}

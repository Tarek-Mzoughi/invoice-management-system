import { ApiProperty } from '@nestjs/swagger';

export class CreateReturnNoteUploadDto {
  @ApiProperty({
    example: 1,
    type: Number,
  })
  uploadId?: number;
}

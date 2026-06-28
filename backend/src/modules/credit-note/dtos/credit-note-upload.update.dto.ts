import { ApiProperty } from '@nestjs/swagger';
import { CreateCreditNoteUploadDto } from './credit-note-upload.create.dto';

export class UpdateCreditNoteUploadDto extends CreateCreditNoteUploadDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;
}

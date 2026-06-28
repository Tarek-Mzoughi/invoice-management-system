import { ApiProperty } from '@nestjs/swagger';
import { CreateReturnNoteUploadDto } from './return-note-upload.create.dto';

export class UpdateReturnNoteUploadDto extends CreateReturnNoteUploadDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;
}

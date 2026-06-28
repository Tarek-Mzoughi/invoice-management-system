import { ApiProperty } from '@nestjs/swagger';
import { CreateDeliveryNoteUploadDto } from './delivery-note-upload.create.dto';

export class UpdateDeliveryNoteUploadDto extends CreateDeliveryNoteUploadDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;
}

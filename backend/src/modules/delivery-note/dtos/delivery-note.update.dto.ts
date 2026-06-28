import { ApiProperty } from '@nestjs/swagger';
import { UpdateDeliveryNoteUploadDto } from './delivery-note-upload.update.dto';
import { IsOptional } from 'class-validator';
import { CreateDeliveryNoteDto } from './delivery-note.create.dto';

export class UpdateDeliveryNoteDto extends CreateDeliveryNoteDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: UpdateDeliveryNoteUploadDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  createInvoice: boolean;
}

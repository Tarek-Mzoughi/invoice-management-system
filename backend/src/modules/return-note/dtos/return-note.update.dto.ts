import { ApiProperty } from '@nestjs/swagger';
import { UpdateReturnNoteUploadDto } from './return-note-upload.update.dto';
import { IsOptional } from 'class-validator';
import { CreateReturnNoteDto } from './return-note.create.dto';

export class UpdateReturnNoteDto extends CreateReturnNoteDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: UpdateReturnNoteUploadDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  createInvoice: boolean;
}

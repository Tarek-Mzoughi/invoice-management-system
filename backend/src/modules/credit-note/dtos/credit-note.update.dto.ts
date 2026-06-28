import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateCreditNoteDto } from './credit-note.create.dto';
import { UpdateCreditNoteUploadDto } from './credit-note-upload.update.dto';

export class UpdateCreditNoteDto extends CreateCreditNoteDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: UpdateCreditNoteUploadDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  amountPaid: number;
}

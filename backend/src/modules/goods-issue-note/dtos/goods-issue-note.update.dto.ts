import { ApiProperty } from '@nestjs/swagger';
import { UpdateGoodsIssueNoteUploadDto } from './goods-issue-note-upload.update.dto';
import { IsOptional } from 'class-validator';
import { CreateGoodsIssueNoteDto } from './goods-issue-note.create.dto';

export class UpdateGoodsIssueNoteDto extends CreateGoodsIssueNoteDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: UpdateGoodsIssueNoteUploadDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  createInvoice: boolean;
}

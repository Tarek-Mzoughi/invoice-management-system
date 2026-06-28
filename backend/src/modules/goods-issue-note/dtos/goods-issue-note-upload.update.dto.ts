import { ApiProperty } from '@nestjs/swagger';
import { CreateGoodsIssueNoteUploadDto } from './goods-issue-note-upload.create.dto';

export class UpdateGoodsIssueNoteUploadDto extends CreateGoodsIssueNoteUploadDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;
}

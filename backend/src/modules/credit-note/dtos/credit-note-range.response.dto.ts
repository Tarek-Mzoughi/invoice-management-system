import { ApiProperty } from '@nestjs/swagger';
import { ResponseCreditNoteDto } from './credit-note.response.dto';

export class ResponseCreditNoteRangeDto {
  @ApiProperty({ type: ResponseCreditNoteDto, nullable: true })
  next: ResponseCreditNoteDto | null;

  @ApiProperty({ type: ResponseCreditNoteDto, nullable: true })
  previous: ResponseCreditNoteDto | null;
}

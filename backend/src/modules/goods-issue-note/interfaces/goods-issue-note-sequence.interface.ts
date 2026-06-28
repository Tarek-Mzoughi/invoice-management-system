import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export interface GoodsIssueNoteSequence {
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

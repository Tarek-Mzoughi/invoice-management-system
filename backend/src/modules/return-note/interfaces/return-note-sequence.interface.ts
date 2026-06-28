import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export interface ReturnNoteSequence {
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

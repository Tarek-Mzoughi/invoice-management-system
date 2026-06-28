import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export interface CreditNoteSequence {
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

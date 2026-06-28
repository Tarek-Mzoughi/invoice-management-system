import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export interface DeliveryNoteSequence {
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

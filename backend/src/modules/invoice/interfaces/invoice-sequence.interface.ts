import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export interface InvoiceSequence {
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

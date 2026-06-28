import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export interface QuotationSequence {
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

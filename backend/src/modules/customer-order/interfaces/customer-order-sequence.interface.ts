import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export interface CustomerOrderSequence {
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

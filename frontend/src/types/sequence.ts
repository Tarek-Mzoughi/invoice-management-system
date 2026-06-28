import { DateFormat } from './enums';
import { DatabaseEntity } from './response/DatabaseEntity';

export enum Sequences {
  INVOICE = 'invoice',
  QUOTATION = 'quotation',
  DELIVERY_NOTE = 'delivery_note',
  GOODS_ISSUE_NOTE = 'goods_issue_note',
  CUSTOMER_ORDER = 'customer_order',
  CREDIT_NOTE = 'credit_note',
  RETURN_NOTE = 'return_note',
  BUYING_INVOICE = 'buying_invoice',
  BUYING_QUOTATION = 'buying_quotation',
  BUYING_DELIVERY_NOTE = 'buying_delivery_note',
  BUYING_GOODS_ISSUE_NOTE = 'buying_goods_issue_note',
  BUYING_CUSTOMER_ORDER = 'buying_customer_order',
  BUYING_CREDIT_NOTE = 'buying_credit_note',
  BUYING_RETURN_NOTE = 'buying_return_note'
}

export interface ResponseSequenceDto extends DatabaseEntity {
  id: number;
  label: string;
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

export interface UpdateSequentialDto {
  prefix?: string;
  dateFormat?: DateFormat;
  next?: number;
}

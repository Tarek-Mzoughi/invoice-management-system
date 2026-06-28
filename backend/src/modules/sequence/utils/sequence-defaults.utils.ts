import { Sequences } from 'src/app/enums/sequences.enum';
import { DateFormat } from '../enums/date-format.enum';

export interface SequenceConfig {
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

export const DEFAULT_SEQUENCE_CONFIGS: Record<Sequences, SequenceConfig> = {
  [Sequences.INVOICE]: {
    prefix: 'INV',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.QUOTATION]: {
    prefix: 'QUO',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.DELIVERY_NOTE]: {
    prefix: 'BLV',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.GOODS_ISSUE_NOTE]: {
    prefix: 'BSE',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.CUSTOMER_ORDER]: {
    prefix: 'COM',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.CREDIT_NOTE]: {
    prefix: 'AVO',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.RETURN_NOTE]: {
    prefix: 'BRT',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.BUYING_INVOICE]: {
    prefix: 'BIN',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.BUYING_QUOTATION]: {
    prefix: 'BQU',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.BUYING_DELIVERY_NOTE]: {
    prefix: 'BBL',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.BUYING_GOODS_ISSUE_NOTE]: {
    prefix: 'BBS',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.BUYING_CUSTOMER_ORDER]: {
    prefix: 'BCO',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.BUYING_CREDIT_NOTE]: {
    prefix: 'BAV',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
  [Sequences.BUYING_RETURN_NOTE]: {
    prefix: 'BBR',
    dateFormat: DateFormat.YYYYMM,
    next: 1,
  },
};

export const SELLING_SEQUENCE_LABELS: Sequences[] = [
  Sequences.QUOTATION,
  Sequences.INVOICE,
  Sequences.DELIVERY_NOTE,
  Sequences.GOODS_ISSUE_NOTE,
  Sequences.CUSTOMER_ORDER,
  Sequences.CREDIT_NOTE,
  Sequences.RETURN_NOTE,
];

export const LEGACY_SEQUENCE_CONFIG_KEYS: Partial<Record<Sequences, string>> = {
  [Sequences.QUOTATION]: 'quotation_sequence',
  [Sequences.INVOICE]: 'invoice_sequence',
  [Sequences.DELIVERY_NOTE]: 'deliveryNote_sequence',
  [Sequences.GOODS_ISSUE_NOTE]: 'goodsIssueNote_sequence',
  [Sequences.CUSTOMER_ORDER]: 'customerOrder_sequence',
  [Sequences.RETURN_NOTE]: 'return-note_sequence',
};

export const ALL_SEQUENCE_LABELS = Object.values(Sequences);

export const getDefaultSequenceConfig = (label: Sequences): SequenceConfig => ({
  ...DEFAULT_SEQUENCE_CONFIGS[label],
});

export const normalizeSequenceLabel = (label: string): Sequences | null => {
  const normalizedLabel = label.trim().toLowerCase();
  return ALL_SEQUENCE_LABELS.includes(normalizedLabel as Sequences)
    ? (normalizedLabel as Sequences)
    : null;
};

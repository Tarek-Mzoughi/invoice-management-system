import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { Sequences } from 'src/app/enums/sequences.enum';
import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';
import {
  formSequential,
  parseSequentialNumber,
} from 'src/modules/sequence/utils/sequence.utils';

export interface DocumentSequenceSource {
  table: string;
  sellingLabel: Sequences;
  buyingLabel: Sequences;
}

export interface DocumentSequenceRow {
  id: number;
  sequential: string;
  date: Date | string | null;
  activityType: ACTIVITY_TYPE;
}

export interface SequenceConfigRow {
  id: number;
  label: string;
  prefix: string;
  dateFormat: DateFormat;
  next: number;
}

export interface DocumentSequenceChange {
  table: string;
  id: number;
  label: Sequences;
  previous: string;
  next: string;
  sequenceNumber: number;
}

export interface SequenceCounterChange {
  id: number;
  label: Sequences;
  previous: number;
  next: number;
}

export interface DocumentSequenceRepairPlan {
  documentChanges: DocumentSequenceChange[];
  sequenceChanges: SequenceCounterChange[];
  errors: string[];
}

export const DOCUMENT_SEQUENCE_SOURCES: DocumentSequenceSource[] = [
  {
    table: 'invoice',
    sellingLabel: Sequences.INVOICE,
    buyingLabel: Sequences.BUYING_INVOICE,
  },
  {
    table: 'quotation',
    sellingLabel: Sequences.QUOTATION,
    buyingLabel: Sequences.BUYING_QUOTATION,
  },
  {
    table: 'customer_order',
    sellingLabel: Sequences.CUSTOMER_ORDER,
    buyingLabel: Sequences.BUYING_CUSTOMER_ORDER,
  },
  {
    table: 'delivery_note',
    sellingLabel: Sequences.DELIVERY_NOTE,
    buyingLabel: Sequences.BUYING_DELIVERY_NOTE,
  },
  {
    table: 'goods_issue_note',
    sellingLabel: Sequences.GOODS_ISSUE_NOTE,
    buyingLabel: Sequences.BUYING_GOODS_ISSUE_NOTE,
  },
  {
    table: 'credit_note',
    sellingLabel: Sequences.CREDIT_NOTE,
    buyingLabel: Sequences.BUYING_CREDIT_NOTE,
  },
  {
    table: 'return_note',
    sellingLabel: Sequences.RETURN_NOTE,
    buyingLabel: Sequences.BUYING_RETURN_NOTE,
  },
];

const resolveLabel = (
  source: DocumentSequenceSource,
  activityType: ACTIVITY_TYPE,
): Sequences =>
  activityType === ACTIVITY_TYPE.BUYING
    ? source.buyingLabel
    : source.sellingLabel;

export function createDocumentSequenceRepairPlan(
  sequences: SequenceConfigRow[],
  documentsByTable: Record<string, DocumentSequenceRow[]>,
  sources: DocumentSequenceSource[] = DOCUMENT_SEQUENCE_SOURCES,
): DocumentSequenceRepairPlan {
  const errors: string[] = [];
  const documentChanges: DocumentSequenceChange[] = [];
  const sequenceMap = new Map(
    sequences.map((sequence) => [sequence.label, sequence]),
  );
  const maximumByLabel = new Map<Sequences, number>();

  for (const source of sources) {
    const targetOwners = new Map<string, number>();

    for (const document of documentsByTable[source.table] || []) {
      const label = resolveLabel(source, document.activityType);
      const sequence = sequenceMap.get(label);
      const sequenceNumber = parseSequentialNumber(document.sequential);
      const date = document.date ? new Date(document.date) : null;

      if (!sequence) {
        errors.push(
          `${source.table}#${document.id}: missing sequence ${label}`,
        );
        continue;
      }
      if (sequenceNumber === null) {
        errors.push(
          `${source.table}#${document.id}: unreadable sequence ${document.sequential}`,
        );
        continue;
      }
      if (!date || Number.isNaN(date.getTime())) {
        errors.push(`${source.table}#${document.id}: missing or invalid date`);
        continue;
      }

      const target = formSequential(
        sequence.prefix,
        sequence.dateFormat,
        sequenceNumber,
        date,
      );
      const existingOwner = targetOwners.get(target);
      if (existingOwner !== undefined && existingOwner !== document.id) {
        errors.push(
          `${source.table}: sequence collision ${target} for #${existingOwner} and #${document.id}`,
        );
        continue;
      }
      targetOwners.set(target, document.id);
      maximumByLabel.set(
        label,
        Math.max(maximumByLabel.get(label) || 0, sequenceNumber),
      );

      if (target !== document.sequential) {
        documentChanges.push({
          table: source.table,
          id: document.id,
          label,
          previous: document.sequential,
          next: target,
          sequenceNumber,
        });
      }
    }
  }

  const managedLabels = new Set(
    sources.flatMap((source) => [source.sellingLabel, source.buyingLabel]),
  );
  const sequenceChanges = sequences
    .filter((sequence) => managedLabels.has(sequence.label as Sequences))
    .map((sequence) => {
      const label = sequence.label as Sequences;
      return {
        id: sequence.id,
        label,
        previous: sequence.next,
        next: (maximumByLabel.get(label) || 0) + 1,
      };
    })
    .filter((change) => change.previous !== change.next);

  return { documentChanges, sequenceChanges, errors };
}

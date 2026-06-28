import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { Sequences } from 'src/app/enums/sequences.enum';
import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';
import {
  createDocumentSequenceRepairPlan,
  DocumentSequenceSource,
} from './document-sequence-repair';

const source: DocumentSequenceSource = {
  table: 'invoice',
  sellingLabel: Sequences.INVOICE,
  buyingLabel: Sequences.BUYING_INVOICE,
};

const sequence = {
  id: 1,
  label: Sequences.INVOICE,
  prefix: 'INV',
  dateFormat: DateFormat.YYYYMM,
  next: 2,
};

describe('document sequence repair', () => {
  it('previews a malformed sequence and reconciles its counter', () => {
    const plan = createDocumentSequenceRepairPlan(
      [sequence],
      {
        invoice: [
          {
            id: 1,
            sequential: 'INV-202657-1',
            date: new Date(2026, 5, 9, 9, 57),
            activityType: ACTIVITY_TYPE.SELLING,
          },
        ],
      },
      [source],
    );

    expect(plan.errors).toEqual([]);
    expect(plan.documentChanges).toEqual([
      expect.objectContaining({
        previous: 'INV-202657-1',
        next: 'INV-2026-06-1',
      }),
    ]);
    expect(plan.sequenceChanges).toEqual([]);
  });

  it('rejects invalid dates and unreadable suffixes', () => {
    const plan = createDocumentSequenceRepairPlan(
      [sequence],
      {
        invoice: [
          {
            id: 1,
            sequential: 'invalid',
            date: null,
            activityType: ACTIVITY_TYPE.SELLING,
          },
        ],
      },
      [source],
    );

    expect(plan.errors).toContain('invoice#1: unreadable sequence invalid');
  });

  it('rejects target collisions', () => {
    const plan = createDocumentSequenceRepairPlan(
      [sequence],
      {
        invoice: [
          {
            id: 1,
            sequential: 'INV-202657-1',
            date: new Date(2026, 5, 9),
            activityType: ACTIVITY_TYPE.SELLING,
          },
          {
            id: 2,
            sequential: 'OTHER-1',
            date: new Date(2026, 5, 9),
            activityType: ACTIVITY_TYPE.SELLING,
          },
        ],
      },
      [source],
    );

    expect(
      plan.errors.some((error) => error.includes('sequence collision')),
    ).toBe(true);
  });

  it('advances a stale counter to the largest existing suffix plus one', () => {
    const plan = createDocumentSequenceRepairPlan(
      [{ ...sequence, next: 2 }],
      {
        invoice: [
          {
            id: 7,
            sequential: 'INV-2026-06-7',
            date: new Date(2026, 5, 9),
            activityType: ACTIVITY_TYPE.SELLING,
          },
        ],
      },
      [source],
    );

    expect(plan.sequenceChanges).toEqual([
      expect.objectContaining({ previous: 2, next: 8 }),
    ]);
  });
});

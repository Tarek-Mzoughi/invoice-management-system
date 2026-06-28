import { DateFormat } from '../enums/date-format.enum';
import {
  findSequentialNeighbors,
  formSequential,
  parseSequential,
  parseSequentialNumber,
} from './sequence.utils';

describe('sequence utils', () => {
  const date = new Date(2026, 5, 9, 14, 57);

  it.each([
    [DateFormat.YYYY, 'INV-2026-3'],
    [DateFormat.YYMM, 'INV-26-06-3'],
    [DateFormat.YYYYMM, 'INV-2026-06-3'],
  ])('formats %s without using minutes', (dateFormat, expected) => {
    expect(formSequential('INV', dateFormat, 3, date)).toBe(expected);
  });

  it('parses valid formatted sequences', () => {
    expect(parseSequential('INV-2026-06-12')).toEqual({
      prefix: 'INV',
      dateFormat: DateFormat.YYYYMM,
      next: 12,
    });
  });

  it('recovers the numeric suffix from malformed legacy sequences', () => {
    expect(parseSequentialNumber('INV-202657-12')).toBe(12);
    expect(parseSequentialNumber('invalid')).toBeNull();
  });

  it('returns no neighbors for a single document', () => {
    const current = { id: 1, sequential: 'INV-202657-1' };

    expect(findSequentialNeighbors(current, [current])).toEqual({
      previous: null,
      next: null,
    });
  });

  it('finds nearest neighbors across sequence gaps and excludes current', () => {
    const documents = [
      { id: 1, sequential: 'INV-2026-06-1' },
      { id: 2, sequential: 'INV-2026-06-4' },
      { id: 3, sequential: 'INV-2026-06-9' },
    ];

    expect(findSequentialNeighbors(documents[1], documents)).toEqual({
      previous: documents[0],
      next: documents[2],
    });
  });

  it('ignores documents from another sequence family', () => {
    const current = { id: 2, sequential: 'BIN-2026-06-2' };
    const demoInvoice = { id: 3, sequential: 'DEMO-INV-0081' };

    expect(findSequentialNeighbors(current, [current, demoInvoice])).toEqual({
      previous: null,
      next: null,
    });
  });

  it('keeps neighbors with the same prefix when the date format changes', () => {
    const documents = [
      { id: 1, sequential: 'BIN-2025-1' },
      { id: 2, sequential: 'BIN-2026-06-2' },
      { id: 3, sequential: 'BIN-26-06-3' },
    ];

    expect(findSequentialNeighbors(documents[1], documents)).toEqual({
      previous: documents[0],
      next: documents[2],
    });
  });
});

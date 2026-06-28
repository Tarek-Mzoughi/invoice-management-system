import { describe, expect, it } from 'vitest';
import { validateDocumentDateRange } from './document-date-validation';

describe('validateDocumentDateRange', () => {
  it('accepts the same calendar day regardless of time', () => {
    expect(
      validateDocumentDateRange(new Date(2026, 5, 9, 23, 59), {
        from: new Date(2026, 5, 9, 8, 0),
        to: new Date(2026, 5, 9, 9, 57)
      })
    ).toBeNull();
  });

  it('rejects a day before the previous document', () => {
    expect(
      validateDocumentDateRange(new Date(2026, 5, 8), {
        from: new Date(2026, 5, 9)
      })
    ).toContain('après ou égale');
  });

  it('rejects a day after the next document', () => {
    expect(
      validateDocumentDateRange(new Date(2026, 5, 10), {
        to: new Date(2026, 5, 9)
      })
    ).toContain('avant ou égale');
  });
});

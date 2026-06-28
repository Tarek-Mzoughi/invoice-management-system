import { describe, expect, it } from 'vitest';
import { INVOICE_STATUS } from '../../../../types';
import {
  INVOICE_EDITABILITY_RULE,
  INVOICE_FORM_STATUS,
  isStatusEditable
} from './editability';

describe('invoice form lifecycle', () => {
  it('uses only canonical statuses for draft and validation actions', () => {
    expect(INVOICE_FORM_STATUS).toEqual({
      draft: INVOICE_STATUS.Draft,
      validated: INVOICE_STATUS.Unpaid
    });
  });

  it.each([
    [INVOICE_STATUS.Draft, true],
    [INVOICE_STATUS.Unpaid, true],
    [INVOICE_STATUS.Validated, false],
    [INVOICE_STATUS.Sent, false],
    [INVOICE_STATUS.Paid, false]
  ])('applies the shared invoice editability rule to %s', (status, expected) => {
    expect(isStatusEditable(status, INVOICE_EDITABILITY_RULE)).toBe(expected);
  });
});

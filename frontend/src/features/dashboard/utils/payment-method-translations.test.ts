import { describe, expect, it } from 'vitest';
import enInvoicing from '../../../../public/locales/en/invoicing.json';
import frInvoicing from '../../../../public/locales/fr/invoicing.json';
import enCommon from '../../../../public/locales/en/common.json';
import frCommon from '../../../../public/locales/fr/common.json';
import { PAYMENT_MODE } from '../../../types/payment';

const readPath = (source: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);

describe('payment translations', () => {
  it.each(Object.values(PAYMENT_MODE))('translates %s in French and English', (key) => {
    expect(readPath(frInvoicing, key)).toEqual(expect.any(String));
    expect(readPath(enInvoicing, key)).toEqual(expect.any(String));
  });

  it('translates the payable-document search placeholder', () => {
    expect(readPath(frCommon, 'filters.search_documents')).toBe(
      'Rechercher des documents...'
    );
    expect(readPath(enCommon, 'filters.search_documents')).toBe('Search documents...');
  });
});

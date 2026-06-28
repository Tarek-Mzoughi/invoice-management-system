import { PERMISSIONS } from './permission.constants';
import {
  canAccessDocumentByActivityType,
  canAccessArticleDocumentChoices,
  canAccessFirmDocumentChoices,
} from './contextual-lookup-permissions';

describe('contextual document lookup permissions', () => {
  it('allows client document choices with selling document creation', () => {
    expect(
      canAccessFirmDocumentChoices('clients', [
        PERMISSIONS.SELLING_DOCUMENTS.CREATE,
      ]),
    ).toBe(true);
  });

  it('allows client document choices without read or selling document permissions', () => {
    expect(canAccessFirmDocumentChoices('clients', [])).toBe(true);
  });

  it('allows supplier document choices with buying document creation', () => {
    expect(
      canAccessFirmDocumentChoices('suppliers', [
        PERMISSIONS.BUYING_DOCUMENTS.CREATE,
      ]),
    ).toBe(true);
  });

  it('allows selling article document choices with selling document creation', () => {
    expect(
      canAccessArticleDocumentChoices('selling', [
        PERMISSIONS.SELLING_DOCUMENTS.CREATE,
      ]),
    ).toBe(true);
  });

  it('allows buying article document choices with buying document creation', () => {
    expect(
      canAccessArticleDocumentChoices('buying', [
        PERMISSIONS.BUYING_DOCUMENTS.CREATE,
      ]),
    ).toBe(true);
  });

  it('allows article document choices without products read or document permissions', () => {
    expect(canAccessArticleDocumentChoices('selling', [])).toBe(true);
    expect(canAccessArticleDocumentChoices('buying', [])).toBe(true);
  });

  it('allows document detail access with update permission in the matching activity scope', () => {
    expect(
      canAccessDocumentByActivityType('selling', [
        PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      ]),
    ).toBe(true);
    expect(
      canAccessDocumentByActivityType('buying', [
        PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
      ]),
    ).toBe(true);
  });

  it('allows document detail read access even without the matching activity scope', () => {
    expect(
      canAccessDocumentByActivityType('selling', [
        PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
      ]),
    ).toBe(true);
    expect(
      canAccessDocumentByActivityType('buying', [
        PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      ]),
    ).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from './permissions';
import { canAccessRoute, resolveRouteAccess } from './routeAccess';
import enCommon from '../../../public/locales/en/common.json';
import frCommon from '../../../public/locales/fr/common.json';

describe('resolveRouteAccess', () => {
  it.each([
    ['/selling/invoice/42', PERMISSIONS.selling_documents.update, '/selling/invoices'],
    ['/selling/quotation/42', PERMISSIONS.selling_documents.update, '/selling/quotations'],
    ['/buying/facture-achat/42', PERMISSIONS.buying_documents.update, '/buying/factures-achat'],
    ['/buying/bon-reception/42', PERMISSIONS.buying_documents.update, '/buying/bons-reception'],
    ['/selling/payment/42', PERMISSIONS.payments.update, '/selling/payments'],
    ['/payments/42/edit', PERMISSIONS.payments.update, '/payments'],
    ['/articles/42', PERMISSIONS.products.update, '/articles'],
    ['/clients/42/edit', PERMISSIONS.clients.update, '/clients'],
    ['/suppliers/42/edit', PERMISSIONS.suppliers.update, '/suppliers']
  ])('protects update route %s', (path, permission, fallbackRoute) => {
    expect(resolveRouteAccess(path)).toMatchObject({ permission, fallbackRoute });
  });

  it.each([
    ['/selling/new-invoice', PERMISSIONS.selling_documents.create],
    ['/buying/nouvelle-facture-achat', PERMISSIONS.buying_documents.create],
    ['/payments/new', PERMISSIONS.payments.create],
    ['/articles/new', PERMISSIONS.products.create],
    ['/clients/new', PERMISSIONS.clients.create],
    ['/suppliers/new', PERMISSIONS.suppliers.create]
  ])('protects create route %s', (path, permission) => {
    expect(resolveRouteAccess(path)).toMatchObject({ permission });
  });

  it.each([
    '/selling/invoices',
    '/buying/factures-achat',
    '/payments',
    '/articles',
    '/clients/42',
    '/suppliers/42'
  ])('does not treat readable route %s as an action route', (path) => {
    expect(resolveRouteAccess(path)).toBeNull();
  });

  it('allows an administrator to bypass an action permission', () => {
    expect(
      canAccessRoute({
        effectivePermissions: [PERMISSIONS.selling_documents.read],
        isAdmin: true,
        path: '/selling/invoice/42'
      })
    ).toBe(true);
  });

  it('denies a read-only user and allows a user with the update permission', () => {
    const path = '/selling/invoice/42';

    expect(
      canAccessRoute({
        effectivePermissions: [PERMISSIONS.selling_documents.read],
        isAdmin: false,
        path
      })
    ).toBe(false);
    expect(
      canAccessRoute({
        effectivePermissions: [
          PERMISSIONS.selling_documents.read,
          PERMISSIONS.selling_documents.update
        ],
        isAdmin: false,
        path
      })
    ).toBe(true);
  });

  it.each([
    'requiresPaymentsUpdate',
    'requiresProductsCreate',
    'requiresProductsUpdate',
    'requiresClientsCreate',
    'requiresClientsUpdate',
    'requiresSuppliersCreate',
    'requiresSuppliersUpdate'
  ])('provides French and English messages for %s', (key) => {
    expect(frCommon.rbac[key as keyof typeof frCommon.rbac]).toBeTruthy();
    expect(enCommon.rbac[key as keyof typeof enCommon.rbac]).toBeTruthy();
  });
});

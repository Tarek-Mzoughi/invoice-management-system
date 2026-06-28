import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from './permissions';
import { resolvePermissionSelection } from './permissionDependencies';

const resolveChecked = (permission: string, selectedPermissions: string[] = []) =>
  resolvePermissionSelection({
    selectedPermissions,
    toggledPermission: permission,
    checked: true
  });

const resolveUnchecked = (permission: string, selectedPermissions: string[]) =>
  resolvePermissionSelection({
    selectedPermissions,
    toggledPermission: permission,
    checked: false
  });

describe('resolvePermissionSelection', () => {
  it('adds only the toggled permission — no auto-add of dependencies', () => {
    const result = resolveChecked(PERMISSIONS.selling_documents.create);

    expect(result.nextPermissions).toEqual([PERMISSIONS.selling_documents.create]);
    expect(result.autoAddedRequiredPermissions).toEqual([]);
    expect(result.suggestedOptionalPermissions).toEqual([]);
  });

  it('does not auto-add any cross-module permissions for selling docs', () => {
    const result = resolveChecked(PERMISSIONS.selling_documents.create);

    expect(result.nextPermissions).not.toContain(PERMISSIONS.clients.read);
    expect(result.nextPermissions).not.toContain(PERMISSIONS.products.read);
    expect(result.nextPermissions).not.toContain(PERMISSIONS.taxes.read);
    expect(result.nextPermissions).not.toContain(PERMISSIONS.treasury.read);
  });

  it('does not auto-add any cross-module permissions for buying docs', () => {
    const result = resolveChecked(PERMISSIONS.buying_documents.create);

    expect(result.nextPermissions).toEqual([PERMISSIONS.buying_documents.create]);
    expect(result.nextPermissions).not.toContain(PERMISSIONS.suppliers.read);
    expect(result.nextPermissions).not.toContain(PERMISSIONS.products.read);
  });

  it('does not auto-add read permission for payments', () => {
    const result = resolveChecked(PERMISSIONS.payments.create);

    expect(result.nextPermissions).toEqual([PERMISSIONS.payments.create]);
    expect(result.nextPermissions).not.toContain(PERMISSIONS.payments.read);
  });

  it('does not auto-add read permission for products', () => {
    const result = resolveChecked(PERMISSIONS.products.create);

    expect(result.nextPermissions).toEqual([PERMISSIONS.products.create]);
    expect(result.nextPermissions).not.toContain(PERMISSIONS.products.read);
  });

  it('preserves existing selections when adding a new permission', () => {
    const result = resolveChecked(PERMISSIONS.selling_documents.create, [
      PERMISSIONS.selling_documents.read,
      PERMISSIONS.clients.read
    ]);

    expect(result.nextPermissions).toEqual(
      expect.arrayContaining([
        PERMISSIONS.selling_documents.read,
        PERMISSIONS.clients.read,
        PERMISSIONS.selling_documents.create
      ])
    );
    expect(result.nextPermissions).toHaveLength(3);
  });

  it('removes only the toggled permission on uncheck', () => {
    const result = resolveUnchecked(PERMISSIONS.clients.read, [
      PERMISSIONS.selling_documents.create,
      PERMISSIONS.selling_documents.read,
      PERMISSIONS.clients.read,
      PERMISSIONS.products.read
    ]);

    expect(result.nextPermissions).not.toContain(PERMISSIONS.clients.read);
    expect(result.nextPermissions).toContain(PERMISSIONS.selling_documents.create);
    expect(result.nextPermissions).toContain(PERMISSIONS.selling_documents.read);
    expect(result.nextPermissions).toContain(PERMISSIONS.products.read);
    expect(result.blockedRemovedPermissions).toEqual([]);
  });

  it('works for simple single permissions (dashboard)', () => {
    const result = resolveChecked(PERMISSIONS.dashboard.read);

    expect(result.nextPermissions).toEqual([PERMISSIONS.dashboard.read]);
    expect(result.autoAddedRequiredPermissions).toEqual([]);
  });
});

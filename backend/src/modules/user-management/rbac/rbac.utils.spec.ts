import {
  ALL_PERMISSION_IDS,
  COLLABORATOR_DEFAULT_PERMISSION_IDS,
  CabinetUserRoleType,
  PERMISSIONS,
} from './permission.constants';
import {
  expandPermissionDependencies,
  getEffectivePermissionIds,
  getMembershipPermissionIds,
  isAdminRoleLabel,
  normalizePermissionSelection,
} from './rbac.utils';

describe('RBAC utils', () => {
  it('treats admin labels as admin roles', () => {
    expect(isAdminRoleLabel('admin')).toBe(true);
    expect(isAdminRoleLabel('Admin')).toBe(true);
    expect(isAdminRoleLabel('standard-user')).toBe(false);
  });

  it('gives admins the complete permission matrix', () => {
    const permissions = getEffectivePermissionIds({
      role: {
        label: 'admin',
        permissions: [],
      },
    } as any);

    expect(permissions).toEqual(ALL_PERMISSION_IDS);
  });

  it('uses cabinet membership roleType before the legacy global role', () => {
    const permissions = getEffectivePermissionIds(
      {
        role: {
          label: 'admin',
          permissions: [],
        },
        cabinetMemberships: [
          {
            cabinetId: 7,
            isActive: true,
            roleType: CabinetUserRoleType.COLLABORATOR,
            permissions: [],
          },
        ],
      } as any,
      7,
    );

    expect(permissions).toEqual(COLLABORATOR_DEFAULT_PERMISSION_IDS);
  });

  it('resolves permissions from the requested cabinet independently', () => {
    const user = {
      role: {
        label: 'standard-user',
        permissions: [],
      },
      cabinetMemberships: [
        {
          cabinetId: 1,
          isActive: true,
          roleType: CabinetUserRoleType.CUSTOM,
          permissions: [],
        },
        {
          cabinetId: 2,
          isActive: true,
          roleType: CabinetUserRoleType.CUSTOM,
          permissions: [{ permissionId: PERMISSIONS.DASHBOARD.READ }],
        },
      ],
    } as any;

    expect(getEffectivePermissionIds(user, 1)).toEqual([]);
    expect(getEffectivePermissionIds(user, 2)).toEqual([
      PERMISSIONS.DASHBOARD.READ,
    ]);
  });

  it('keeps selling document creation as the only selected permission', () => {
    expect(
      normalizePermissionSelection([PERMISSIONS.SELLING_DOCUMENTS.CREATE]),
    ).toEqual([PERMISSIONS.SELLING_DOCUMENTS.CREATE]);
  });

  it('keeps buying document creation as the only selected permission', () => {
    expect(
      normalizePermissionSelection([PERMISSIONS.BUYING_DOCUMENTS.CREATE]),
    ).toEqual([PERMISSIONS.BUYING_DOCUMENTS.CREATE]);
  });

  it('keeps products.create as the only selected permission', () => {
    expect(normalizePermissionSelection([PERMISSIONS.PRODUCTS.CREATE])).toEqual(
      [PERMISSIONS.PRODUCTS.CREATE],
    );
  });

  it('keeps payments.create as the only selected permission', () => {
    expect(normalizePermissionSelection([PERMISSIONS.PAYMENTS.CREATE])).toEqual(
      [PERMISSIONS.PAYMENTS.CREATE],
    );
  });

  it('drops unknown permissions without adding dependencies', () => {
    expect(
      normalizePermissionSelection([
        PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
        'unknown-permission',
      ]),
    ).toEqual([PERMISSIONS.SELLING_DOCUMENTS.UPDATE]);
  });

  it('does not expose obsolete user management permissions in the configurable matrix', () => {
    const obsoletePermissionIds = [
      'read-user_management',
      'create-user_management',
      'update-user_management',
      'delete-user_management',
    ];

    expect(ALL_PERMISSION_IDS).not.toEqual(
      expect.arrayContaining(obsoletePermissionIds),
    );
    expect(
      normalizePermissionSelection([
        PERMISSIONS.DASHBOARD.READ,
        ...obsoletePermissionIds,
      ]),
    ).toEqual([PERMISSIONS.DASHBOARD.READ]);
  });

  it('does not add cross-module permissions automatically', () => {
    const permissions = normalizePermissionSelection([
      PERMISSIONS.SELLING_DOCUMENTS.CREATE,
      PERMISSIONS.BUYING_DOCUMENTS.CREATE,
    ]);

    expect(permissions).toEqual([
      PERMISSIONS.SELLING_DOCUMENTS.CREATE,
      PERMISSIONS.BUYING_DOCUMENTS.CREATE,
    ]);
    expect(permissions).not.toEqual(
      expect.arrayContaining([
        PERMISSIONS.SELLING_DOCUMENTS.READ,
        PERMISSIONS.BUYING_DOCUMENTS.READ,
        PERMISSIONS.CLIENTS.READ,
        PERMISSIONS.SUPPLIERS.READ,
        PERMISSIONS.PRODUCTS.READ,
        PERMISSIONS.TREASURY.READ,
        PERMISSIONS.TAXES.READ,
        PERMISSIONS.DOCUMENT_SETTINGS.READ,
      ]),
    );
  });
});

describe('expandPermissionDependencies', () => {
  it('expands selling_documents.create to include all required + optional read deps', () => {
    const expanded = expandPermissionDependencies([
      PERMISSIONS.SELLING_DOCUMENTS.CREATE,
    ]);

    expect(expanded).toEqual(
      expect.arrayContaining([
        PERMISSIONS.SELLING_DOCUMENTS.CREATE,
        PERMISSIONS.SELLING_DOCUMENTS.READ,
        PERMISSIONS.CLIENTS.READ,
        PERMISSIONS.PRODUCTS.READ,
        PERMISSIONS.TAXES.READ,
        PERMISSIONS.TREASURY.READ,
        PERMISSIONS.DOCUMENT_SETTINGS.READ,
      ]),
    );
  });

  it('expands buying_documents.create to include suppliers, products, taxes, etc.', () => {
    const expanded = expandPermissionDependencies([
      PERMISSIONS.BUYING_DOCUMENTS.CREATE,
    ]);

    expect(expanded).toEqual(
      expect.arrayContaining([
        PERMISSIONS.BUYING_DOCUMENTS.CREATE,
        PERMISSIONS.BUYING_DOCUMENTS.READ,
        PERMISSIONS.SUPPLIERS.READ,
        PERMISSIONS.PRODUCTS.READ,
        PERMISSIONS.TAXES.READ,
        PERMISSIONS.TREASURY.READ,
        PERMISSIONS.DOCUMENT_SETTINGS.READ,
      ]),
    );
    // should NOT include clients (that's selling docs only)
    expect(expanded).not.toContain(PERMISSIONS.CLIENTS.READ);
  });

  it('expands products.create to include taxes', () => {
    const expanded = expandPermissionDependencies([
      PERMISSIONS.PRODUCTS.CREATE,
    ]);

    expect(expanded).toEqual(
      expect.arrayContaining([
        PERMISSIONS.PRODUCTS.CREATE,
        PERMISSIONS.PRODUCTS.READ,
        PERMISSIONS.TAXES.READ,
      ]),
    );
  });

  it('expands payments.create to include payments.read and treasury.read', () => {
    const expanded = expandPermissionDependencies([
      PERMISSIONS.PAYMENTS.CREATE,
    ]);

    expect(expanded).toEqual(
      expect.arrayContaining([
        PERMISSIONS.PAYMENTS.CREATE,
        PERMISSIONS.PAYMENTS.READ,
        PERMISSIONS.TREASURY.READ,
      ]),
    );
    // no taxes dep for payments
    expect(expanded).not.toContain(PERMISSIONS.TAXES.READ);
  });

  it('does not expand read-only permissions', () => {
    const expanded = expandPermissionDependencies([PERMISSIONS.CLIENTS.READ]);

    expect(expanded).toEqual([PERMISSIONS.CLIENTS.READ]);
  });

  it('deduplicates when multiple permissions share the same deps', () => {
    const expanded = expandPermissionDependencies([
      PERMISSIONS.SELLING_DOCUMENTS.CREATE,
      PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    ]);

    const taxesReadCount = expanded.filter(
      (p) => p === PERMISSIONS.TAXES.READ,
    ).length;
    expect(taxesReadCount).toBe(1);
  });
});

describe('getMembershipPermissionIds – CUSTOM role expansion', () => {
  it('expands CUSTOM role permissions dynamically at runtime', () => {
    const membership = {
      cabinetId: 1,
      isActive: true,
      roleType: CabinetUserRoleType.CUSTOM,
      permissions: [
        { permissionId: PERMISSIONS.SELLING_DOCUMENTS.CREATE },
        { permissionId: PERMISSIONS.SELLING_DOCUMENTS.DELETE },
        { permissionId: PERMISSIONS.SELLING_DOCUMENTS.READ },
        { permissionId: PERMISSIONS.SELLING_DOCUMENTS.UPDATE },
      ],
    } as any;

    const effective = getMembershipPermissionIds(membership);

    // The 4 stored permissions
    expect(effective).toEqual(
      expect.arrayContaining([
        PERMISSIONS.SELLING_DOCUMENTS.CREATE,
        PERMISSIONS.SELLING_DOCUMENTS.DELETE,
        PERMISSIONS.SELLING_DOCUMENTS.READ,
        PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      ]),
    );
    // Dynamically expanded deps (not stored in DB)
    expect(effective).toEqual(
      expect.arrayContaining([
        PERMISSIONS.CLIENTS.READ,
        PERMISSIONS.PRODUCTS.READ,
        PERMISSIONS.TAXES.READ,
        PERMISSIONS.TREASURY.READ,
        PERMISSIONS.DOCUMENT_SETTINGS.READ,
      ]),
    );
  });

  it('does not expand ADMIN or COLLABORATOR role permissions', () => {
    const adminMembership = {
      roleType: CabinetUserRoleType.ADMIN,
      permissions: [],
    } as any;
    const collabMembership = {
      roleType: CabinetUserRoleType.COLLABORATOR,
      permissions: [],
    } as any;

    expect(getMembershipPermissionIds(adminMembership)).toEqual(
      ALL_PERMISSION_IDS,
    );
    expect(getMembershipPermissionIds(collabMembership)).toEqual(
      COLLABORATOR_DEFAULT_PERMISSION_IDS,
    );
  });
});

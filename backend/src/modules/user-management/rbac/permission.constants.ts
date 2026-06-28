export const RBAC_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];

export enum CabinetUserRoleType {
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR',
  CUSTOM = 'CUSTOM',
}

export type PermissionResource =
  | 'dashboard'
  | 'enterprise'
  | 'selling_documents'
  | 'buying_documents'
  | 'payments'
  | 'suppliers'
  | 'clients'
  | 'products'
  | 'treasury'
  | 'price_lists'
  | 'taxes'
  | 'document_settings';

export interface PermissionMatrixResource {
  key: PermissionResource;
  label: string;
  actions: RbacAction[];
}

export const PERMISSION_MATRIX: PermissionMatrixResource[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    actions: ['read'],
  },
  {
    key: 'enterprise',
    label: 'Entreprise',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'selling_documents',
    label: 'Vente',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'buying_documents',
    label: 'Achat',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'payments',
    label: 'Paiements',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'suppliers',
    label: 'Fournisseurs',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'clients',
    label: 'Clients',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'products',
    label: 'Articles',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'treasury',
    label: 'Tresorerie',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'price_lists',
    label: 'Listes de prix',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'taxes',
    label: 'Taxes',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'document_settings',
    label: 'Parametres documents',
    actions: ['read', 'create', 'update', 'delete'],
  },
];

export const SYSTEM_ROLE_LABELS = ['admin', 'standard-user'] as const;

export const ADMIN_ROLE_LABELS = [
  'admin',
  'owner',
  'proprietaire',
  'propriétaire',
] as const;

export const COLLABORATOR_ROLE_LABELS = [
  'standard-user',
  'collaborator',
  'collaborateur',
] as const;

export const permissionId = (
  action: RbacAction,
  resource: PermissionResource,
) => `${action}-${resource}`;

export const ALL_PERMISSION_IDS = PERMISSION_MATRIX.flatMap((resource) =>
  resource.actions.map((action) => permissionId(action, resource.key)),
);

export const OFFICIAL_PERMISSION_IDS = new Set(ALL_PERMISSION_IDS);

const COLLABORATOR_READ_RESOURCES: PermissionResource[] = [
  'dashboard',
  'enterprise',
  'selling_documents',
  'buying_documents',
  'payments',
  'suppliers',
  'clients',
  'products',
  'treasury',
  'price_lists',
  'taxes',
  'document_settings',
];

const COLLABORATOR_WRITE_RESOURCES: PermissionResource[] = [
  'selling_documents',
  'buying_documents',
  'payments',
  'suppliers',
  'clients',
  'products',
  'price_lists',
];

export const COLLABORATOR_DEFAULT_PERMISSION_IDS = Array.from(
  new Set([
    ...COLLABORATOR_READ_RESOURCES.map((resource) =>
      permissionId('read', resource),
    ),
    ...COLLABORATOR_WRITE_RESOURCES.flatMap((resource) => [
      permissionId('create', resource),
      permissionId('update', resource),
    ]),
  ]),
);

export const PERMISSIONS = Object.freeze({
  DASHBOARD: {
    READ: permissionId('read', 'dashboard'),
  },
  ENTERPRISE: {
    READ: permissionId('read', 'enterprise'),
    CREATE: permissionId('create', 'enterprise'),
    UPDATE: permissionId('update', 'enterprise'),
    DELETE: permissionId('delete', 'enterprise'),
  },
  SELLING_DOCUMENTS: {
    READ: permissionId('read', 'selling_documents'),
    CREATE: permissionId('create', 'selling_documents'),
    UPDATE: permissionId('update', 'selling_documents'),
    DELETE: permissionId('delete', 'selling_documents'),
  },
  BUYING_DOCUMENTS: {
    READ: permissionId('read', 'buying_documents'),
    CREATE: permissionId('create', 'buying_documents'),
    UPDATE: permissionId('update', 'buying_documents'),
    DELETE: permissionId('delete', 'buying_documents'),
  },
  PAYMENTS: {
    READ: permissionId('read', 'payments'),
    CREATE: permissionId('create', 'payments'),
    UPDATE: permissionId('update', 'payments'),
    DELETE: permissionId('delete', 'payments'),
  },
  SUPPLIERS: {
    READ: permissionId('read', 'suppliers'),
    CREATE: permissionId('create', 'suppliers'),
    UPDATE: permissionId('update', 'suppliers'),
    DELETE: permissionId('delete', 'suppliers'),
  },
  CLIENTS: {
    READ: permissionId('read', 'clients'),
    CREATE: permissionId('create', 'clients'),
    UPDATE: permissionId('update', 'clients'),
    DELETE: permissionId('delete', 'clients'),
  },
  PRODUCTS: {
    READ: permissionId('read', 'products'),
    CREATE: permissionId('create', 'products'),
    UPDATE: permissionId('update', 'products'),
    DELETE: permissionId('delete', 'products'),
  },
  TREASURY: {
    READ: permissionId('read', 'treasury'),
    CREATE: permissionId('create', 'treasury'),
    UPDATE: permissionId('update', 'treasury'),
    DELETE: permissionId('delete', 'treasury'),
  },
  PRICE_LISTS: {
    READ: permissionId('read', 'price_lists'),
    CREATE: permissionId('create', 'price_lists'),
    UPDATE: permissionId('update', 'price_lists'),
    DELETE: permissionId('delete', 'price_lists'),
  },
  TAXES: {
    READ: permissionId('read', 'taxes'),
    CREATE: permissionId('create', 'taxes'),
    UPDATE: permissionId('update', 'taxes'),
    DELETE: permissionId('delete', 'taxes'),
  },
  DOCUMENT_SETTINGS: {
    READ: permissionId('read', 'document_settings'),
    CREATE: permissionId('create', 'document_settings'),
    UPDATE: permissionId('update', 'document_settings'),
    DELETE: permissionId('delete', 'document_settings'),
  },
});

/**
 * Dynamic permission expansion map.
 *
 * When a CUSTOM-role user holds a permission listed as a key here, the
 * backend **automatically grants** every permission in the corresponding
 * value array at runtime.  Nothing extra is persisted in the database —
 * the expansion is purely in-memory so the admin UI stays clean.
 *
 * Both "required" (e.g. read own resource, read clients) and "optional"
 * (e.g. read taxes, treasury…) dependencies are included so that
 * the feature works end-to-end without 403s on auxiliary endpoints.
 */
export const PERMISSION_DEPENDENCIES: Record<string, string[]> = Object.freeze({
  // ── Selling documents ────────────────────────────────────────────
  [permissionId('create', 'selling_documents')]: [
    permissionId('read', 'selling_documents'),
    permissionId('read', 'clients'),
    permissionId('read', 'products'),
    permissionId('read', 'taxes'),
    permissionId('read', 'treasury'),
    permissionId('read', 'document_settings'),
  ],
  [permissionId('update', 'selling_documents')]: [
    permissionId('read', 'selling_documents'),
    permissionId('read', 'clients'),
    permissionId('read', 'products'),
    permissionId('read', 'taxes'),
    permissionId('read', 'treasury'),
    permissionId('read', 'document_settings'),
  ],
  [permissionId('delete', 'selling_documents')]: [
    permissionId('read', 'selling_documents'),
  ],

  // ── Buying documents ─────────────────────────────────────────────
  [permissionId('create', 'buying_documents')]: [
    permissionId('read', 'buying_documents'),
    permissionId('read', 'suppliers'),
    permissionId('read', 'products'),
    permissionId('read', 'taxes'),
    permissionId('read', 'treasury'),
    permissionId('read', 'document_settings'),
  ],
  [permissionId('update', 'buying_documents')]: [
    permissionId('read', 'buying_documents'),
    permissionId('read', 'suppliers'),
    permissionId('read', 'products'),
    permissionId('read', 'taxes'),
    permissionId('read', 'treasury'),
    permissionId('read', 'document_settings'),
  ],
  [permissionId('delete', 'buying_documents')]: [
    permissionId('read', 'buying_documents'),
  ],

  // ── Payments ─────────────────────────────────────────────────────
  [permissionId('create', 'payments')]: [
    permissionId('read', 'payments'),
    permissionId('read', 'treasury'),
  ],
  [permissionId('update', 'payments')]: [
    permissionId('read', 'payments'),
    permissionId('read', 'treasury'),
  ],
  [permissionId('delete', 'payments')]: [permissionId('read', 'payments')],

  // ── Products ─────────────────────────────────────────────────────
  [permissionId('create', 'products')]: [
    permissionId('read', 'products'),
    permissionId('read', 'taxes'),
  ],
  [permissionId('update', 'products')]: [
    permissionId('read', 'products'),
    permissionId('read', 'taxes'),
  ],
  [permissionId('delete', 'products')]: [permissionId('read', 'products')],

  // ── Clients ──────────────────────────────────────────────────────
  [permissionId('create', 'clients')]: [permissionId('read', 'clients')],
  [permissionId('update', 'clients')]: [permissionId('read', 'clients')],
  [permissionId('delete', 'clients')]: [permissionId('read', 'clients')],

  // ── Suppliers ────────────────────────────────────────────────────
  [permissionId('create', 'suppliers')]: [permissionId('read', 'suppliers')],
  [permissionId('update', 'suppliers')]: [permissionId('read', 'suppliers')],
  [permissionId('delete', 'suppliers')]: [permissionId('read', 'suppliers')],

  // ── Treasury ─────────────────────────────────────────────────────
  [permissionId('create', 'treasury')]: [permissionId('read', 'treasury')],
  [permissionId('update', 'treasury')]: [permissionId('read', 'treasury')],
  [permissionId('delete', 'treasury')]: [permissionId('read', 'treasury')],

  // ── Taxes ────────────────────────────────────────────────────────
  [permissionId('create', 'taxes')]: [permissionId('read', 'taxes')],
  [permissionId('update', 'taxes')]: [permissionId('read', 'taxes')],
  [permissionId('delete', 'taxes')]: [permissionId('read', 'taxes')],

  // ── Price Lists ──────────────────────────────────────────────────
  [permissionId('create', 'price_lists')]: [
    permissionId('read', 'price_lists'),
    permissionId('read', 'products'),
  ],
  [permissionId('update', 'price_lists')]: [
    permissionId('read', 'price_lists'),
    permissionId('read', 'products'),
  ],
  [permissionId('delete', 'price_lists')]: [
    permissionId('read', 'price_lists'),
  ],

  // ── Document Settings ────────────────────────────────────────────
  [permissionId('create', 'document_settings')]: [
    permissionId('read', 'document_settings'),
  ],
  [permissionId('update', 'document_settings')]: [
    permissionId('read', 'document_settings'),
  ],
  [permissionId('delete', 'document_settings')]: [
    permissionId('read', 'document_settings'),
  ],

  // ── Enterprise ───────────────────────────────────────────────────
  [permissionId('update', 'enterprise')]: [permissionId('read', 'enterprise')],
});

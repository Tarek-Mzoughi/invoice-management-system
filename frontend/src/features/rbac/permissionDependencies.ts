import type { PermissionAction, PermissionResource } from './permissions';

type PermissionId = `${PermissionAction}-${PermissionResource}`;

export interface PermissionDependencyDefinition {
  permission: PermissionId;
  required: readonly PermissionId[];
  optional: readonly PermissionId[];
}

export interface ResolvePermissionSelectionInput {
  selectedPermissions: string[];
  toggledPermission: string;
  checked: boolean;
}

export interface ResolvePermissionSelectionResult {
  nextPermissions: string[];
  autoAddedRequiredPermissions: string[];
  blockedRemovedPermissions: string[];
  suggestedOptionalPermissions: string[];
  warnings: string[];
}

const permissionId = (
  action: PermissionAction,
  resource: PermissionResource
): PermissionId => `${action}-${resource}`;

export const PERMISSION_DEPENDENCY_MATRIX = [
  {
    permission: permissionId('create', 'selling_documents'),
    required: [
      permissionId('read', 'selling_documents'),
      permissionId('read', 'clients'),
      permissionId('read', 'products')
    ],
    optional: [
      permissionId('read', 'taxes'),
      permissionId('read', 'treasury'),
      permissionId('read', 'document_settings')
    ]
  },
  {
    permission: permissionId('update', 'selling_documents'),
    required: [
      permissionId('read', 'selling_documents'),
      permissionId('read', 'clients'),
      permissionId('read', 'products')
    ],
    optional: [
      permissionId('read', 'taxes'),
      permissionId('read', 'treasury'),
      permissionId('read', 'document_settings')
    ]
  },
  {
    permission: permissionId('create', 'buying_documents'),
    required: [
      permissionId('read', 'buying_documents'),
      permissionId('read', 'suppliers'),
      permissionId('read', 'products')
    ],
    optional: [
      permissionId('read', 'taxes'),
      permissionId('read', 'treasury'),
      permissionId('read', 'document_settings')
    ]
  },
  {
    permission: permissionId('update', 'buying_documents'),
    required: [
      permissionId('read', 'buying_documents'),
      permissionId('read', 'suppliers'),
      permissionId('read', 'products')
    ],
    optional: [
      permissionId('read', 'taxes'),
      permissionId('read', 'treasury'),
      permissionId('read', 'document_settings')
    ]
  },
  {
    permission: permissionId('create', 'payments'),
    required: [permissionId('read', 'payments')],
    optional: []
  },
  {
    permission: permissionId('update', 'payments'),
    required: [permissionId('read', 'payments')],
    optional: []
  },
  {
    permission: permissionId('create', 'products'),
    required: [permissionId('read', 'products')],
    optional: [permissionId('read', 'taxes')]
  },
  {
    permission: permissionId('update', 'products'),
    required: [permissionId('read', 'products')],
    optional: [permissionId('read', 'taxes')]
  }
] as const satisfies readonly PermissionDependencyDefinition[];

const unique = (permissionIds: string[]) => Array.from(new Set(permissionIds));

const findDependencyDefinition = (permission: string) =>
  PERMISSION_DEPENDENCY_MATRIX.find((definition) => definition.permission === permission);

const getImplicitReadPermission = (permission: string): string | undefined => {
  const [action, resource] = permission.split('-') as [PermissionAction, PermissionResource];
  if (!resource || action === 'read') return undefined;
  if (!['create', 'update', 'delete'].includes(action)) return undefined;
  return permissionId('read', resource);
};

export const buildRequiredPermissionDependencyMap = (): Record<string, string[]> =>
  ({});

export const getRequiredPermissions = (permission: string): string[] => {
  const result = new Set<string>();
  const queue = [
    ...(findDependencyDefinition(permission)?.required || []),
    getImplicitReadPermission(permission)
  ].filter((dependency): dependency is string => Boolean(dependency));

  while (queue.length > 0) {
    const currentPermission = queue.shift()!;
    if (currentPermission === permission || result.has(currentPermission)) continue;

    result.add(currentPermission);
    queue.push(...getRequiredPermissions(currentPermission));
  }

  return Array.from(result);
};

export const getOptionalPermissions = (permission: string): string[] =>
  [...(findDependencyDefinition(permission)?.optional || [])];

export const getBlockingDependents = (
  _permission: string,
  _selectedPermissions: string[]
): string[] => [];

/**
 * Resolves the next permission selection after a toggle.
 *
 * NO dependencies are auto-added in the UI. The admin checks only what they
 * want to grant explicitly. The backend expands all functional dependencies
 * (required + optional) dynamically at runtime via `computeEffectivePermissions`.
 *
 * This keeps the UI clean: sidebar and module access reflect only explicit grants.
 */
export const resolvePermissionSelection = ({
  selectedPermissions,
  toggledPermission,
  checked
}: ResolvePermissionSelectionInput): ResolvePermissionSelectionResult => {
  const selected = unique(selectedPermissions);

  if (!checked) {
    return {
      nextPermissions: selected.filter((permission) => permission !== toggledPermission),
      autoAddedRequiredPermissions: [],
      blockedRemovedPermissions: [],
      suggestedOptionalPermissions: [],
      warnings: []
    };
  }

  return {
    nextPermissions: unique([...selected, toggledPermission]),
    autoAddedRequiredPermissions: [],
    blockedRemovedPermissions: [],
    suggestedOptionalPermissions: [],
    warnings: []
  };
};

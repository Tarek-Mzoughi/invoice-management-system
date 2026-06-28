import { buildRequiredPermissionDependencyMap } from './permissionDependencies';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete';

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
  actions: PermissionAction[];
}

export const permissionId = (action: PermissionAction, resource: PermissionResource) =>
  `${action}-${resource}`;

export const PERMISSIONS = {
  dashboard: { read: permissionId('read', 'dashboard') },
  enterprise: {
    read: permissionId('read', 'enterprise'),
    create: permissionId('create', 'enterprise'),
    update: permissionId('update', 'enterprise'),
    delete: permissionId('delete', 'enterprise')
  },
  selling_documents: {
    read: permissionId('read', 'selling_documents'),
    create: permissionId('create', 'selling_documents'),
    update: permissionId('update', 'selling_documents'),
    delete: permissionId('delete', 'selling_documents')
  },
  buying_documents: {
    read: permissionId('read', 'buying_documents'),
    create: permissionId('create', 'buying_documents'),
    update: permissionId('update', 'buying_documents'),
    delete: permissionId('delete', 'buying_documents')
  },
  payments: {
    read: permissionId('read', 'payments'),
    create: permissionId('create', 'payments'),
    update: permissionId('update', 'payments'),
    delete: permissionId('delete', 'payments')
  },
  suppliers: {
    read: permissionId('read', 'suppliers'),
    create: permissionId('create', 'suppliers'),
    update: permissionId('update', 'suppliers'),
    delete: permissionId('delete', 'suppliers')
  },
  clients: {
    read: permissionId('read', 'clients'),
    create: permissionId('create', 'clients'),
    update: permissionId('update', 'clients'),
    delete: permissionId('delete', 'clients')
  },
  products: {
    read: permissionId('read', 'products'),
    create: permissionId('create', 'products'),
    update: permissionId('update', 'products'),
    delete: permissionId('delete', 'products')
  },
  treasury: {
    read: permissionId('read', 'treasury'),
    create: permissionId('create', 'treasury'),
    update: permissionId('update', 'treasury'),
    delete: permissionId('delete', 'treasury')
  },
  price_lists: {
    read: permissionId('read', 'price_lists'),
    create: permissionId('create', 'price_lists'),
    update: permissionId('update', 'price_lists'),
    delete: permissionId('delete', 'price_lists')
  },
  taxes: {
    read: permissionId('read', 'taxes'),
    create: permissionId('create', 'taxes'),
    update: permissionId('update', 'taxes'),
    delete: permissionId('delete', 'taxes')
  },
  document_settings: {
    read: permissionId('read', 'document_settings'),
    create: permissionId('create', 'document_settings'),
    update: permissionId('update', 'document_settings'),
    delete: permissionId('delete', 'document_settings')
  }
} as const;

export const PERMISSION_DEPENDENCIES: Record<string, string[]> =
  buildRequiredPermissionDependencyMap();

export const hasPermission = (
  permissionIds: string[] | undefined,
  permissionId: string | undefined
) => Boolean(permissionId && permissionIds?.includes(permissionId));

export const hasAnyPermission = (
  permissionIds: string[] | undefined,
  permissionIdsToCheck: string[]
) => permissionIdsToCheck.some((permissionIdToCheck) => hasPermission(permissionIds, permissionIdToCheck));

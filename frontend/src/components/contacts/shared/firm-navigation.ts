import type { FirmEntityType } from '@/types';
import type { FirmModuleConfig } from './firm-table.types';

type FirmRouteId = number | string;

export const getClientListPath = () => '/clients';
export const getClientNewPath = () => '/clients/new';
export const getClientDetailPath = (id: FirmRouteId) => `/clients/${id}`;
export const getClientEditPath = (id: FirmRouteId) => `/clients/${id}/edit`;

export const getSupplierListPath = () => '/suppliers';
export const getSupplierNewPath = () => '/suppliers/new';
export const getSupplierDetailPath = (id: FirmRouteId) => `/suppliers/${id}`;
export const getSupplierEditPath = (id: FirmRouteId) => `/suppliers/${id}/edit`;

export const CLIENT_FIRM_MODULE_CONFIG: FirmModuleConfig = {
  entityType: 'clients',
  moduleKey: 'clients',
  listPath: getClientListPath(),
  newPath: getClientNewPath(),
  detailPath: getClientDetailPath,
  editPath: getClientEditPath
};

export const SUPPLIER_FIRM_MODULE_CONFIG: FirmModuleConfig = {
  entityType: 'suppliers',
  moduleKey: 'suppliers',
  listPath: getSupplierListPath(),
  newPath: getSupplierNewPath(),
  detailPath: getSupplierDetailPath,
  editPath: getSupplierEditPath
};

export const getFirmModuleConfig = (entityType: FirmEntityType): FirmModuleConfig =>
  entityType === 'suppliers' ? SUPPLIER_FIRM_MODULE_CONFIG : CLIENT_FIRM_MODULE_CONFIG;

export const getLegacyFirmEntityQuery = (entityType: FirmEntityType) => `?entity=${entityType}`;

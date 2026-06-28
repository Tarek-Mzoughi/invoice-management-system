export type FirmEntityContext = 'clients' | 'suppliers';

export const getFirmEntityContext = (value: unknown): FirmEntityContext => {
  if (Array.isArray(value)) {
    return value[0] === 'suppliers' ? 'suppliers' : 'clients';
  }

  return value === 'suppliers' ? 'suppliers' : 'clients';
};

export const getFirmEntityQuery = (entity: FirmEntityContext) => `?entity=${entity}`;

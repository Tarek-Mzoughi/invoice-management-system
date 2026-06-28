import type { Firm, FirmEntityType } from '@/types';

export type FirmTypeFilter = 'all' | 'company' | 'person';

export type FirmModuleKey = 'clients' | 'suppliers';

export interface FirmModuleConfig {
  entityType: FirmEntityType;
  moduleKey: FirmModuleKey;
  listPath: string;
  newPath: string;
  detailPath: (id: number) => string;
  editPath: (id: number) => string;
}

export interface FirmActionsMenuProps {
  config: FirmModuleConfig;
  disabled?: boolean;
  firm: Firm;
  onDeleteRequest: (firm: Firm) => void;
}


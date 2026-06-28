import React from 'react';
import type { Firm } from '@/types';
import { FirmTableRow } from '@/components/contacts/shared/FirmTableRow';
import { SUPPLIER_FIRM_MODULE_CONFIG } from '@/components/contacts/shared/firm-navigation';
import { SupplierActionsMenu } from './SupplierActionsMenu';

interface SupplierTableRowProps {
  disabled?: boolean;
  firm: Firm;
  onDeleteRequest: (firm: Firm) => void;
}

export function SupplierTableRow({ disabled, firm, onDeleteRequest }: SupplierTableRowProps) {
  return (
    <FirmTableRow
      actionsMenu={SupplierActionsMenu}
      config={SUPPLIER_FIRM_MODULE_CONFIG}
      disabled={disabled}
      firm={firm}
      onDeleteRequest={onDeleteRequest}
    />
  );
}


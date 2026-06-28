import React from 'react';
import type { Firm } from '@/types';
import { FirmTableRow } from '@/components/contacts/shared/FirmTableRow';
import { CLIENT_FIRM_MODULE_CONFIG } from '@/components/contacts/shared/firm-navigation';
import { ClientActionsMenu } from './ClientActionsMenu';

interface ClientTableRowProps {
  disabled?: boolean;
  firm: Firm;
  onDeleteRequest: (firm: Firm) => void;
}

export function ClientTableRow({ disabled, firm, onDeleteRequest }: ClientTableRowProps) {
  return (
    <FirmTableRow
      actionsMenu={ClientActionsMenu}
      config={CLIENT_FIRM_MODULE_CONFIG}
      disabled={disabled}
      firm={firm}
      onDeleteRequest={onDeleteRequest}
    />
  );
}


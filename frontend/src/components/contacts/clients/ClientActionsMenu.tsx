import React from 'react';
import { FirmActionsMenu } from '@/components/contacts/shared/FirmActionsMenu';
import { CLIENT_FIRM_MODULE_CONFIG } from '@/components/contacts/shared/firm-navigation';
import type { FirmActionsMenuProps } from '@/components/contacts/shared/firm-table.types';

export function ClientActionsMenu(props: FirmActionsMenuProps) {
  return <FirmActionsMenu {...props} config={CLIENT_FIRM_MODULE_CONFIG} />;
}

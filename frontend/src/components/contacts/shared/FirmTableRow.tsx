import React from 'react';
import { format } from 'date-fns';
import { Eye, Pencil } from 'lucide-react';
import { useRouter } from 'next/router';
import { useGuardedNavigation } from '@/features/rbac/useGuardedNavigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Firm } from '@/types';
import { FirmActionIconButton } from './FirmActionIconButton';
import {
  getFirmPhone,
  getFirmSecondaryText,
  getMainFirmInterlocutorEntry,
  getMainFirmInterlocutorName
} from './firm-formatters';
import type { FirmActionsMenuProps, FirmModuleConfig } from './firm-table.types';
import { firmMutedTextClassName, firmTextClassName } from './FirmListLayout';

interface FirmTableRowProps {
  actionsMenu: React.ComponentType<FirmActionsMenuProps>;
  config: FirmModuleConfig;
  disabled?: boolean;
  firm: Firm;
  onDeleteRequest: (firm: Firm) => void;
}

export function FirmTableRow({
  actionsMenu: ActionsMenu,
  config,
  disabled,
  firm,
  onDeleteRequest
}: FirmTableRowProps) {
  const router = useRouter();
  const guardedNavigation = useGuardedNavigation();
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');
  const firmId = firm.id || 0;
  const isActive = firm.isActive !== false;
  const mainEntry = getMainFirmInterlocutorEntry(firm);
  const mainInterlocutor = mainEntry?.interlocutor;
  const mainName = getMainFirmInterlocutorName(firm);

  const openDetail = () => {
    if (!disabled && firmId) router.push(config.detailPath(firmId));
  };

  return (
    <tr
      className={cn(
        'text-sm text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900/70 [&>td]:border-b [&>td]:border-zinc-200 [&>td]:dark:border-zinc-800',
        !isActive && 'opacity-60'
      )}
    >
      <td className="px-4 py-3 align-middle">
        <button
          type="button"
          className="flex flex-col text-left disabled:cursor-not-allowed disabled:opacity-80"
          disabled={disabled || !firmId}
          onClick={openDetail}
        >
          <span className="font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50">
            {firm.name || '-'}
          </span>
          <span className={cn('text-xs', firmMutedTextClassName)}>
            {getFirmSecondaryText(firm, tContacts('firm.empty_cells.website'))}
          </span>
        </button>
      </td>

      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col">
          <span className="font-medium text-zinc-950 dark:text-zinc-50">{mainName || '-'}</span>
          <span className={cn('text-xs', firmMutedTextClassName)}>
            {mainEntry?.position || mainInterlocutor?.email || '-'}
          </span>
        </div>
      </td>

      <td className={cn('px-4 py-3 align-middle', firmTextClassName)}>
        {getFirmPhone(firm) || (
          <span className={firmMutedTextClassName}>{tContacts('firm.empty_cells.phone')}</span>
        )}
      </td>

      <td className="px-4 py-3 align-middle">
        <span
          className={cn(
            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
            firm.isPerson
              ? 'border-primary/30 bg-primary/10 text-foreground dark:text-zinc-100'
              : 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
          )}
        >
          {firm.isPerson
            ? tContacts('firm.attributes.particular_entreprise_type')
            : tContacts('firm.attributes.entreprise_type')}
        </span>
        {!isActive && (
          <span className="ml-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
            {tContacts('firm.attributes.inactive')}
          </span>
        )}
      </td>

      <td className={cn('px-4 py-3 align-middle', firmTextClassName)}>
        {firm.activity?.label || (
          <span className={firmMutedTextClassName}>{tContacts('firm.empty_cells.activity')}</span>
        )}
      </td>

      <td className={cn('px-4 py-3 align-middle', firmTextClassName)}>
        {firm.createdAt ? format(new Date(firm.createdAt), 'dd/MM/yyyy') : '-'}
      </td>

      <td className="px-4 py-3 align-middle text-right">
        <div className="flex items-center justify-end gap-1">
          <FirmActionIconButton
            disabled={disabled || !firmId}
            label={tContacts('firm.actions.view')}
            onClick={openDetail}
          >
            <Eye className="h-4 w-4" />
          </FirmActionIconButton>
          <FirmActionIconButton
            disabled={disabled || !firmId}
            label={tCommon('commands.edit')}
            onClick={() => firmId && guardedNavigation.push(config.editPath(firmId))}
          >
            <Pencil className="h-4 w-4" />
          </FirmActionIconButton>
          <ActionsMenu
            config={config}
            disabled={disabled}
            firm={firm}
            onDeleteRequest={onDeleteRequest}
          />
        </div>
      </td>
    </tr>
  );
}

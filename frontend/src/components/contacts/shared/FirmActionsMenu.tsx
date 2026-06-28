import React from 'react';
import { Clock3, MoreHorizontal, Power, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getErrorMessage } from '@/utils/errors';
import type { FirmActionsMenuProps } from './firm-table.types';

export function FirmActionsMenu({ config, disabled, firm, onDeleteRequest }: FirmActionsMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');
  const moduleTitle = tContacts(`firm.modules.${config.moduleKey}.title`);
  const isActive = firm.isActive !== false;

  const { mutate: toggleActive, isPending: isTogglePending } = useMutation({
    mutationFn: () => {
      if (!firm.id) {
        return Promise.reject(new Error('Missing firm id'));
      }
      return isActive ? api.firm.deactivate(firm.id) : api.firm.activate(firm.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['firms'] });
      toast.success(
        tContacts(isActive ? 'firm.actions.deactivate_success' : 'firm.actions.activate_success')
      );
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage(
          'contacts',
          mutationError,
          tContacts(isActive ? 'firm.actions.deactivate_error' : 'firm.actions.activate_error')
        )
      );
    }
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${tCommon('commands.more_actions')} - ${moduleTitle}`}
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-8 w-8 rounded-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled={!firm.id || isTogglePending} onClick={() => toggleActive()}>
          <Power className="h-4 w-4" />
          {isActive ? tCommon('commands.deactivate') : tCommon('commands.activate')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-600 focus:text-rose-600"
          disabled={!firm.id}
          onClick={() => onDeleteRequest(firm)}
        >
          <Trash2 className="h-4 w-4" />
          {tCommon('commands.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

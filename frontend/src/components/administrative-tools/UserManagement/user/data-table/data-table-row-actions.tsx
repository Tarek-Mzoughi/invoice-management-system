import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Settings2, ShieldCheck, ShieldMinus, Telescope } from 'lucide-react';
import { useUserManager } from '../hooks/useUserManager';
import { useUserActions } from './action-context';
import { ResponseUserDto as User } from '@/types';
import { useTranslation } from 'react-i18next';

interface DataTableRowActionsProps {
  row: Row<User>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const user = row.original;
  const { t: tCommon } = useTranslation('common');
  const { openUpdateUserSheet, openActivateUserDialog, openDeactivateUserDialog } =
    useUserActions();

  const userManager = useUserManager();

  const targetUser = () => {
    userManager.setUser(user);
    userManager.set('password', undefined);
    userManager.set('confirmPassword', undefined);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[160px]">
        <DropdownMenuLabel className="text-center">{tCommon('commands.actions')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}}>
          <Telescope className="h-5 w-5 mr-2" />
          {tCommon('commands.inspect')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            targetUser();
            openUpdateUserSheet();
          }}>
          <Settings2 className="h-5 w-5 mr-2" />
          {tCommon('commands.modify')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.isActive ? (
          <DropdownMenuItem
            onClick={() => {
              targetUser();
              openDeactivateUserDialog();
            }}>
            <ShieldMinus className="h-5 w-5 mr-2" /> {tCommon('commands.deactivate')}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              targetUser();
              openActivateUserDialog();
            }}>
            <ShieldCheck className="h-5 w-5 mr-2" /> {tCommon('commands.activate')}
          </DropdownMenuItem>
        )}

        {/*<DropdownMenuItem
          onClick={() => {
            targetRole();
            openDuplicateRoleDialog();
          }}
        >
          <CopyIcon className="h-5 w-5 mr-2" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            targetRole();
            openDeleteRoleDialog();
          }}
        >
          <Trash2 className="h-5 w-5 mr-2" /> Delete
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

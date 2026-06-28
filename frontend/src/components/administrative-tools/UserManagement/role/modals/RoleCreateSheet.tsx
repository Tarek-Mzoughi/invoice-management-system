import { BookUser } from 'lucide-react';
import { useSheet } from '@/components/shared/Sheets';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { RoleForm } from '../RoleForm';
import { usePermissions } from '@/hooks/content/usePermissions';
import { useTranslation } from 'react-i18next';

interface RoleCreateSheet {
  createRole?: () => void;
  isCreatePending?: boolean;
  resetRole?: () => void;
}

export const useRoleCreateSheet = ({ createRole, isCreatePending, resetRole }: RoleCreateSheet) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { permissions, isFetchPermissionsPending } = usePermissions();

  const {
    SheetFragment: createRoleSheet,
    openSheet: openCreateRoleSheet,
    closeSheet: closeCreateRoleSheet
  } = useSheet({
    title: (
      <div className="flex items-center gap-2">
        <BookUser />
        {tSettings('roles.new')}
      </div>
    ),
    description: tSettings('roles.hints.create_dialog_hint'),
    children: (
      <div>
        <RoleForm className="my-4" permissions={permissions} />
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              createRole?.();
            }}>
            {tCommon('commands.save')}
            <Spinner show={isCreatePending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeCreateRoleSheet();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'min-w-[25vw]',
    onToggle: resetRole
  });

  return {
    createRoleSheet,
    openCreateRoleSheet,
    closeCreateRoleSheet
  };
};

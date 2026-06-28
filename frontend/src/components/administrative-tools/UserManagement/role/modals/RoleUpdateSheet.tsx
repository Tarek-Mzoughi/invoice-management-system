import { BookUser } from 'lucide-react';
import { useSheet } from '@/components/shared/Sheets';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { RoleForm } from '../RoleForm';
import { usePermissions } from '@/hooks/content/usePermissions';
import { useTranslation } from 'react-i18next';

interface RoleUpdateSheet {
  updateRole?: () => void;
  isUpdatePending?: boolean;
  resetRole?: () => void;
}

export const useRoleUpdateSheet = ({ updateRole, isUpdatePending, resetRole }: RoleUpdateSheet) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { permissions, isFetchPermissionsPending } = usePermissions();
  const {
    SheetFragment: updateRoleSheet,
    openSheet: openUpdateRoleSheet,
    closeSheet: closeUpdateRoleSheet
  } = useSheet({
    title: (
      <div className="flex items-center gap-2">
        <BookUser />
        {tSettings('roles.update')}
      </div>
    ),
    description: tSettings('roles.hints.update_dialog_hint'),
    children: (
      <div>
        <RoleForm className="my-4" permissions={permissions} />
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              updateRole?.();
            }}>
            {tCommon('commands.save')}

            <Spinner show={isUpdatePending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeUpdateRoleSheet();
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
    updateRoleSheet,
    openUpdateRoleSheet,
    closeUpdateRoleSheet
  };
};

import { useDialog } from '@/components/shared/Dialogs';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface RoleDeleteDialogProps {
  roleLabel?: string;
  deleteRole?: () => void;
  isDeletionPending?: boolean;
  resetRole?: () => void;
}

export const useRoleDeleteDialog = ({
  roleLabel,
  deleteRole,
  isDeletionPending,
  resetRole
}: RoleDeleteDialogProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const {
    DialogFragment: deleteRoleDialog,
    openDialog: openDeleteRoleDialog,
    closeDialog: closeDeleteRoleDialog
  } = useDialog({
    title: (
      <div className="leading-normal">
        {tSettings('roles.delete')} <span className="font-light">{roleLabel}</span> ?
      </div>
    ),
    description: tSettings('roles.hints.delete_dialog_hint'),
    children: (
      <div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              deleteRole?.();
              closeDeleteRoleDialog();
            }}>
            {tCommon('commands.confirm')}

            <Spinner show={isDeletionPending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              resetRole?.();
              closeDeleteRoleDialog();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'w-[500px]',
    onToggle: resetRole
  });

  return {
    deleteRoleDialog,
    openDeleteRoleDialog,
    closeDeleteRoleDialog
  };
};

import { useDialog } from '@/components/shared/Dialogs';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface RoleDeleteDialogProps {
  userFullname?: string;
  deactivateUser?: () => void;
  isDeactivationPending?: boolean;
  resetUser?: () => void;
}

export const useDeactivateUserDialog = ({
  userFullname,
  deactivateUser,
  isDeactivationPending,
  resetUser
}: RoleDeleteDialogProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const {
    DialogFragment: deactivateUserDialog,
    openDialog: openDeactivateUserDialog,
    closeDialog: closeDeactivateUserDialog
  } = useDialog({
    title: (
      <div className="leading-normal">
        {tSettings('users.deactivate')} <span className="font-light">{userFullname}</span> ?
      </div>
    ),
    description: tSettings('users.hints.deactivate_dialog_hint'),
    children: (
      <div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              deactivateUser?.();
              closeDeactivateUserDialog();
            }}>
            {tCommon('commands.deactivate')}
            <Spinner show={isDeactivationPending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeDeactivateUserDialog();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'w-[500px]',
    onToggle: resetUser
  });

  return {
    deactivateUserDialog,
    openDeactivateUserDialog,
    closeDeactivateUserDialog
  };
};

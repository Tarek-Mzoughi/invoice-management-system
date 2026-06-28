import { useDialog } from '@/components/shared/Dialogs';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface RoleDeleteDialogProps {
  userFullname?: string;
  activateUser?: () => void;
  isActivationPending?: boolean;
  resetUser?: () => void;
}

export const useActivateUserDialog = ({
  userFullname,
  activateUser,
  isActivationPending,
  resetUser
}: RoleDeleteDialogProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const {
    DialogFragment: activateUserDialog,
    openDialog: openActivateUserDialog,
    closeDialog: closeActivateUserDialog
  } = useDialog({
    title: (
      <div className="leading-normal">
        {tSettings('users.activate')} <span className="font-light">{userFullname}</span> ?
      </div>
    ),
    description: tSettings('users.hints.activate_dialog_hint'),
    children: (
      <div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              activateUser?.();
              closeActivateUserDialog();
            }}>
            {tCommon('commands.activate')}
            <Spinner show={isActivationPending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeActivateUserDialog();
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
    activateUserDialog,
    openActivateUserDialog,
    closeActivateUserDialog
  };
};

import { User } from 'lucide-react';
import { useSheet } from '@/components/shared/Sheets';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { UserForm } from '../UserForm';
import { useRoles } from '@/hooks/content/useRoles';
import { useTranslation } from 'react-i18next';

interface UserUpdateSheet {
  updateUser?: () => void;
  isUpdatePending?: boolean;
  resetUser?: () => void;
}

export const useUserUpdateSheet = ({ updateUser, isUpdatePending, resetUser }: UserUpdateSheet) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { roles, isFetchRolesPending } = useRoles();
  const {
    SheetFragment: updateUserSheet,
    openSheet: openUpdateUserSheet,
    closeSheet: closeUpdateUserSheet
  } = useSheet({
    title: (
      <div className="flex items-center gap-2">
        <User />
        {tSettings('users.update')}
      </div>
    ),
    description: tSettings('users.hints.update_dialog_hint'),
    children: (
      <div>
        <UserForm className="my-4" roles={roles} forceShowPasswordInputs={false} />
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              updateUser?.();
            }}>
            {tCommon('commands.save')}
            <Spinner show={isUpdatePending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeUpdateUserSheet();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'min-w-[25vw]',
    onToggle: resetUser
  });

  return {
    updateUserSheet,
    openUpdateUserSheet,
    closeUpdateUserSheet
  };
};

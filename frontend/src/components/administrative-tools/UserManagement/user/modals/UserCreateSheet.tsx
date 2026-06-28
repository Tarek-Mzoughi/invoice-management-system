import { User } from 'lucide-react';
import { useSheet } from '@/components/shared/Sheets';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { UserForm } from '../UserForm';
import { useRoles } from '@/hooks/content/useRoles';
import { useTranslation } from 'react-i18next';

interface UserCreateSheet {
  createUser?: () => void;
  isCreatePending?: boolean;
  resetUser?: () => void;
}

export const useUserCreateSheet = ({ createUser, isCreatePending, resetUser }: UserCreateSheet) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { roles, isFetchRolesPending } = useRoles();
  const {
    SheetFragment: createUserSheet,
    openSheet: openCreateUserSheet,
    closeSheet: closeCreateUserSheet
  } = useSheet({
    title: (
      <div className="flex items-center gap-2">
        <User />
        {tSettings('users.new')}
      </div>
    ),
    description: tSettings('users.hints.create_dialog_hint'),
    children: (
      <div>
        <UserForm className="my-4" roles={roles} />
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              createUser?.();
            }}>
            {tCommon('commands.save')}
            <Spinner show={isCreatePending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeCreateUserSheet();
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
    createUserSheet,
    openCreateUserSheet,
    closeCreateUserSheet
  };
};

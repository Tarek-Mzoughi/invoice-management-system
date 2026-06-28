import { useDialog } from '@/components/shared/Dialogs';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface RoleDuplicateDialogProps {
  roleLabel?: string;
  duplicateRole?: () => void;
  isDuplicationPending?: boolean;
  resetRole?: () => void;
}

export const useRoleDuplicateDialog = ({
  roleLabel,
  duplicateRole,
  isDuplicationPending,
  resetRole
}: RoleDuplicateDialogProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const {
    DialogFragment: duplicateRoleDialog,
    openDialog: openDuplicateRoleDialog,
    closeDialog: closeDuplicateRoleDialog
  } = useDialog({
    title: (
      <div className="leading-normal">
        {tSettings('roles.duplicate')} <span className="font-light">{roleLabel}</span> ?
      </div>
    ),
    description: tSettings('roles.hints.duplicate_dialog_hint'),
    children: (
      <div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              duplicateRole?.();
              closeDuplicateRoleDialog();
            }}>
            {tCommon('commands.confirm')}

            <Spinner show={isDuplicationPending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeDuplicateRoleDialog();
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
    duplicateRoleDialog,
    openDuplicateRoleDialog,
    closeDuplicateRoleDialog
  };
};

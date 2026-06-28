import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { useDialog } from '@/components/shared/Dialogs';

export const useInterlocutorDeleteDialog = (
  interlocutorFullName?: string,
  deleteInterlocutor?: () => void,
  isDeletionPending?: boolean
) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');
  const {
    DialogFragment: deleteInterlocutorDialog,
    openDialog: openDeleteInterlocutorDialog,
    closeDialog: closeDeleteInterlocutorDialog
  } = useDialog({
    title: (
      <div className="leading-normal">
        {tContacts('interlocutor.delete_prompt')}{' '}
        <span className="font-light">{interlocutorFullName}</span> ?
      </div>
    ),
    description: tContacts('interlocutor.delete_dialog_description'),
    children: (
      <div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              deleteInterlocutor?.();
              closeDeleteInterlocutorDialog();
            }}>
            {tCommon('commands.confirm')}
            <Spinner show={isDeletionPending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeDeleteInterlocutorDialog();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'w-[500px]'
  });

  return { deleteInterlocutorDialog, openDeleteInterlocutorDialog, closeDeleteInterlocutorDialog };
};

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { useDialog } from '@/components/shared/Dialogs';

export const useInterlocutorPromoteDialog = (
  interlocutorFullName?: string,
  promoteInterlocutor?: () => void,
  isPromotionPending?: boolean
) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');
  const {
    DialogFragment: promoteInterlocutorDialog,
    openDialog: openPromoteInterlocutorDialog,
    closeDialog: closePromoteInterlocutorDialog
  } = useDialog({
    title: (
      <div className="leading-normal">
        {tContacts('interlocutor.promote_prompt')}{' '}
        <span className="font-light">{interlocutorFullName}</span> ?
      </div>
    ),
    description: tContacts('interlocutor.promote_dialog_description'),
    children: (
      <div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              promoteInterlocutor?.();
              closePromoteInterlocutorDialog();
            }}>
            {tCommon('commands.confirm')}
            <Spinner show={isPromotionPending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closePromoteInterlocutorDialog();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'w-[500px]'
  });

  return {
    promoteInterlocutorDialog,
    openPromoteInterlocutorDialog,
    closePromoteInterlocutorDialog
  };
};

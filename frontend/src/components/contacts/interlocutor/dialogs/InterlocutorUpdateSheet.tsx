import { BookUser } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSheet } from '@/components/shared/Sheets';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { InterlocutorContactInformation } from '../form/InterlocutorContactInformation';

export const useInterlocutorUpdateSheet = (
  firmId?: number,
  updateInterlocutor?: () => void,
  isUpdatePending?: boolean,
  resetInterlocutor?: () => void
) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');
  const {
    SheetFragment: updateInterlocutorSheet,
    openSheet: openUpdateInterlocutorSheet,
    closeSheet: closeUpdateInterlocutorSheet
  } = useSheet({
    title: (
      <div className="flex items-center gap-2">
        <BookUser />
        {tContacts('interlocutor.update')}
      </div>
    ),
    description: tContacts('interlocutor.update_dialog_description'),
    children: (
      <div>
        <InterlocutorContactInformation className="my-4" />
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              updateInterlocutor?.();
            }}>
            {tCommon('commands.save')}
            <Spinner show={isUpdatePending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeUpdateInterlocutorSheet();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'min-w-[25vw]',
    onToggle: resetInterlocutor
  });

  return { updateInterlocutorSheet, openUpdateInterlocutorSheet, closeUpdateInterlocutorSheet };
};

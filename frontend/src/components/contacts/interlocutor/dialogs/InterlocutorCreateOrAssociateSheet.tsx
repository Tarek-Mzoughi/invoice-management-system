import { BookUser } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSheet } from '@/components/shared/Sheets';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InterlocutorContactInformation } from '../form/InterlocutorContactInformation';
import { InterlocutorAssociation } from '../form/InterlocutorAssociation';
import useInterlocutors from '@/hooks/content/useInterlocutors';
import React from 'react';
import { firm } from '@/api';

export const useInterlocutorCreateOrAssociateSheet = (
  firmId?: number,
  createInterlocutor?: () => void,
  associateInterlocutor?: () => void,
  isCreateOrAssociatePending?: boolean,
  resetInterlocutor?: () => void
) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');
  const [activeTab, setActiveTab] = React.useState('new');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    resetInterlocutor?.();
  };

  const { interlocutors, isFetchInterlocutorsPending, refetchInterloctors } = useInterlocutors();

  React.useEffect(() => {
    if (firmId) refetchInterloctors();
  }, [firmId, refetchInterloctors]);

  const {
    SheetFragment: createInterlocutorSheet,
    openSheet: openCreateInterlocutorSheet,
    closeSheet: closeCreateInterlocutorSheet
  } = useSheet({
    title: (
      <div className="flex items-center gap-2">
        <BookUser />
        {tContacts('interlocutor.new')}
      </div>
    ),
    description: tContacts('interlocutor.create_dialog_description'),
    children: (
      <div className="my-4">
        <Tabs defaultValue="new">
          <TabsList>
            <TabsTrigger value="new" onClick={() => handleTabChange('new')}>
              {tContacts('interlocutor.create_or_associate.new')}
            </TabsTrigger>
            <TabsTrigger value="existing" onClick={() => handleTabChange('existing')}>
              {tContacts('interlocutor.create_or_associate.associate')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="new">
            <InterlocutorContactInformation className="my-4" />
          </TabsContent>
          <TabsContent value="existing">
            <InterlocutorAssociation
              className="my-4"
              loading={isFetchInterlocutorsPending}
              interlocutors={interlocutors}
            />
          </TabsContent>
        </Tabs>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              if (activeTab === 'new') createInterlocutor?.();
              else {
                associateInterlocutor?.();
                refetchInterloctors();
              }
            }}>
            {tCommon('commands.save')}
            <Spinner show={isCreateOrAssociatePending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeCreateInterlocutorSheet();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'min-w-[25vw]',
    onToggle: resetInterlocutor
  });

  return { createInterlocutorSheet, openCreateInterlocutorSheet, closeCreateInterlocutorSheet };
};

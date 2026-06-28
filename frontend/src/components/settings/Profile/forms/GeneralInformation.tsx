import React from 'react';
import { UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';
import { useUserStore } from '@/hooks/stores/useUserStore';
import { ProfileSection } from '../ProfileSection';
import { useProfileFormStructure } from '../useProfileFormStructure';

interface GeneralInformationProps {
  className?: string;
  isPending?: boolean;
}

export const GeneralInformation = ({ className, isPending }: GeneralInformationProps) => {
  const userStore = useUserStore();
  const { t } = useTranslation('settings');
  const { generalFormStructure } = useProfileFormStructure({
    userManager: userStore,
    isPending
  });

  return (
    <ProfileSection
      className={className}
      icon={UserCircle}
      title={t('profile.general_information')}
      description={t('profile.general_information_description')}
    >
      <FormBuilder structure={generalFormStructure} />
    </ProfileSection>
  );
};

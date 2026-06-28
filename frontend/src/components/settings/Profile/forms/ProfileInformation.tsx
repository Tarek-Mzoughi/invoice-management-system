import React from 'react';
import { ContactRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';
import { useUserStore } from '@/hooks/stores/useUserStore';
import { ProfileSection } from '../ProfileSection';
import { useProfileFormStructure } from '../useProfileFormStructure';

interface ProfileInformationProps {
  className?: string;
  isPending?: boolean;
}

export const ProfileInformation = ({ className, isPending }: ProfileInformationProps) => {
  const userStore = useUserStore();
  const { t } = useTranslation('settings');
  const { profileFormStructure } = useProfileFormStructure({
    userManager: userStore,
    isPending
  });

  return (
    <ProfileSection
      className={className}
      icon={ContactRound}
      title={t('profile.profile_information')}
      description={t('profile.profile_information_description')}
    >
      <FormBuilder structure={profileFormStructure} />
    </ProfileSection>
  );
};

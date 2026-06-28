import React from 'react';
import { KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';
import { useUserStore } from '@/hooks/stores/useUserStore';
import { cn } from '@/lib/utils';
import { ProfileSection } from '../ProfileSection';
import { useProfileFormStructure } from '../useProfileFormStructure';

interface SecurityInformationProps {
  className?: string;
  isPending?: boolean;
}

export const SecurityInformation = ({ className, isPending }: SecurityInformationProps) => {
  const userStore = useUserStore();
  const { t } = useTranslation('settings');
  const { securityFormStructure } = useProfileFormStructure({
    userManager: userStore,
    isPending
  });

  return (
    <ProfileSection
      className={cn(
        'border-amber-200/80 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/10',
        className
      )}
      icon={KeyRound}
      title={t('profile.security_information')}
      description={t('profile.security_information_description')}
    >
      <FormBuilder structure={securityFormStructure} />
    </ProfileSection>
  );
};

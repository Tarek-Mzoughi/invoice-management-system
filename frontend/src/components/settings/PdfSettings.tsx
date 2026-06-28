import React from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import { useTranslation } from 'react-i18next';

type TabKey = 'templates';

interface PdfSettingsProps {
  className?: string;
  defaultValue: TabKey;
}

export const PdfSettings: React.FC<PdfSettingsProps> = ({ className, defaultValue }) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes } = useBreadcrumb();

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('home.sections.pdf') },
      { title: tSettings(`home.cards.pdf_${defaultValue}.title`) }
    ]);
  }, [router.locale, defaultValue, setRoutes, tCommon, tSettings]);

  return className ? <div className={cn('hidden', className)} /> : null;
};

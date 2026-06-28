import React from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Separator } from '../ui/separator';
import SidebarNav from '../sidebar-nav';
import { Building, Landmark, User } from 'lucide-react';

interface InformationalSettingsProps {
  className?: string;
  children?: React.ReactNode;
}

export const InformationalSettings: React.FC<InformationalSettingsProps> = ({
  className,
  children
}) => {
  //next-router
  const router = useRouter();

  //translations
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  //menu items
  const sidebarNavItems = [
    {
      title: tCommon('settings.account.my_profile'),
      icon: <User size={18} />,
      href: '/settings/account/profile'
    },
    {
      title: tCommon('settings.account.my_cabinet'),
      icon: <Building size={18} />,
      href: '/settings/account/cabinet'
    },
    {
      title: tCommon('settings.account.bank_accounts'),
      icon: <Landmark size={18} />,
      href: '/settings/account/banks'
    }
  ];

  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden m-5 lg:mx-10', className)}>
      <div className="space-y-0.5 py-5 sm:py-0">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {tSettings('account.singular')}
        </h1>
        <p className="text-muted-foreground">{tSettings('account.description')}</p>
      </div>
      <Separator className="my-4 lg:my-6" />
      <div className="flex flex-col flex-1 overflow-hidden md:space-y-2 lg:flex-row lg:space-x-12">
        <aside className="flex-1 mb-2">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex flex-col flex-[7] overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

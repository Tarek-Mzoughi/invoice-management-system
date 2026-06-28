import React from 'react';
import { cn } from '@/lib/utils';
import { Info, Hourglass, File, FileText, Wallet, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import SidebarNav from '@/components/sidebar-nav';
import useFirm from '@/hooks/content/useFirm';
import { Spinner } from '@/components/shared';

interface FirmDetailsProps {
  className?: string;
  firmId: string;
  children?: React.ReactNode;
}

export const FirmDetails: React.FC<FirmDetailsProps> = ({ className, firmId, children }) => {
  //translations
  const { t: tContacts } = useTranslation('contacts');

  const { firm, isFetchFirmPending } = useFirm(parseInt(firmId));

  //menu items
  const sidebarNavItems = [
    {
      title: tContacts('firm.detailmenu.overview'),
      icon: <Info size={18} />,
      href: `/contacts/firm/${firmId}/overview`
    },
    {
      title: tContacts('firm.detailmenu.interlocutors'),
      icon: <Users size={18} />,
      href: `/contacts/firm/${firmId}/interlocutors`
    },
    {
      title: tContacts('firm.detailmenu.quotations'),
      icon: <File size={18} />,
      href: `/contacts/firm/${firmId}/quotations`
    },
    {
      title: tContacts('firm.detailmenu.invoices'),
      icon: <FileText size={18} />,
      href: `/contacts/firm/${firmId}/invoices`
    },
    {
      title: tContacts('firm.detailmenu.payments'),
      icon: <Wallet size={18} />,
      href: `/contacts/firm/${firmId}/payments`
    },
    {
      title: tContacts('firm.detailmenu.chronological'),
      icon: <Hourglass size={18} />,
      href: `/contacts/firm/${firmId}/chronological`
    }
  ];

  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden m-5 lg:mx-10', className)}>
      <div className="space-y-0.5 py-5 sm:py-0">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {tContacts('firm.detailmenu.title', { firmName: firm?.name })}
        </h1>
        <p className="text-muted-foreground">
          {tContacts('firm.detailmenu.description', { firmName: firm?.name })}
        </p>
      </div>
      <Separator className="my-4 lg:my-6" />
      <div className="flex-1 flex flex-col overflow-hidden md:space-y-2 lg:flex-row lg:space-x-12 ">
        <aside className="flex-1 mb-2">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex flex-col flex-[7] overflow-hidden">
          {!isFetchFirmPending ? (
            children
          ) : (
            <Spinner className="h-screen" show={isFetchFirmPending} />
          )}
        </div>
      </div>
    </div>
  );
};

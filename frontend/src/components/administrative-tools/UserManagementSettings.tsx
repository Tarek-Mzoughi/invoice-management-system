import { Lock, PackageCheck, Users } from 'lucide-react';
import { Separator } from '../ui/separator';
import SidebarNav from '../sidebar-nav';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface UserManagementProps {
  className?: string;
  children?: React.ReactNode;
}

export default function UserManagementSettings({ className, children }: UserManagementProps) {
  //translations
  const { t: tSettings } = useTranslation('settings');

  //menu items
  const sidebarNavItems = [
    {
      title: tSettings('users.singular'),
      icon: <Users size={18} />,
      href: '/settings/admin/users'
    },
    {
      title: tSettings('roles.singular'),
      icon: <PackageCheck size={18} />,
      href: '/settings/admin/roles'
    },
    {
      title: tSettings('permissions.singular'),
      icon: <Lock size={18} />,
      href: '/settings/admin/permissions'
    }
  ];

  return (
    <div className={cn('flex-1 flex flex-col overflow-hidden m-5 lg:mx-10', className)}>
      <div className="space-y-0.5 py-5 sm:py-0">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {tSettings('user_management.singular')}
        </h1>
        <p className="text-muted-foreground">{tSettings('home.description')}</p>
      </div>
      <Separator className="my-4 lg:my-6" />
      <div className="flex-1 flex flex-col overflow-hidden md:space-y-2 lg:flex-row lg:space-x-12 ">
        <aside className="flex-1 mb-2">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex flex-col flex-[7] overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

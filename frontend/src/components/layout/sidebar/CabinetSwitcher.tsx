import React from 'react';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useActiveCabinet, useSwitchCabinet } from '@/hooks/content/useCabinetSwitcher';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentPermissions } from '@/features/rbac/usePermissions';
import { PERMISSIONS } from '@/features/rbac/permissions';
import { useRouter } from 'next/router';
import { useUploadPreviewUrl } from '@/hooks/use-upload-preview-url';
import { Cabinet } from '@/types';

const CabinetLogo = ({
  cabinet,
  size = 'md'
}: {
  cabinet?: Cabinet | null;
  size?: 'sm' | 'md';
}) => {
  const logoUrl = useUploadPreviewUrl({ id: cabinet?.logoId });
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';
  const boxSize = size === 'sm' ? 'size-6 rounded-sm' : 'size-8 rounded-lg';

  return (
    <div
      className={`flex ${boxSize} shrink-0 items-center justify-center overflow-hidden border bg-primary/10 text-primary`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={cabinet?.enterpriseName || 'Cabinet'}
          width={size === 'sm' ? 24 : 32}
          height={size === 'sm' ? 24 : 32}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <Building2 className={iconSize} />
      )}
    </div>
  );
};

export function CabinetSwitcher() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { activeCabinet, cabinets } = useActiveCabinet();
  const { switchCabinet, isSwitching } = useSwitchCabinet();
  const { hasPermission } = useCurrentPermissions();
  const [open, setOpen] = React.useState(false);

  const canCreateCabinet = hasPermission(PERMISSIONS.enterprise.create);

  if (!activeCabinet) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              aria-expanded={open}
              aria-label={t('sidebar.switch_cabinet')}
            >
              <CabinetLogo cabinet={activeCabinet} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeCabinet.enterpriseName || t('sidebar.cabinet')}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t('sidebar.active_cabinet')}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t('sidebar.cabinets')}
            </DropdownMenuLabel>
            {cabinets
              .filter((c) => c.onboardingCompleted !== false)
              .map((cabinet) => (
                <DropdownMenuItem
                  key={cabinet.id}
                  className="gap-2 p-2 cursor-pointer"
                  disabled={isSwitching}
                  onClick={() => {
                    if (cabinet.id !== activeCabinet.id && cabinet.id) {
                      switchCabinet(cabinet.id);
                    }
                    setOpen(false);
                  }}
                >
                  <CabinetLogo cabinet={cabinet} size="sm" />
                  <span className="truncate flex-1">
                    {cabinet.enterpriseName || t('sidebar.cabinet')}
                  </span>
                  {cabinet.id === activeCabinet.id && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            {canCreateCabinet && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 p-2 cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    router.push('/onboarding/company?mode=new');
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    {t('sidebar.create_new_cabinet')}
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

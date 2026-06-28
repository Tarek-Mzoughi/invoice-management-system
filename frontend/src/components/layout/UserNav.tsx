import React from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { identifyUser, identifyUserAvatar } from '@/lib/user';
import { useCurrentUser } from '@/hooks/content/user/useCurrentUser';
import { signOut } from 'next-auth/react';
import { useAuthPersistStore } from '@/hooks/stores/useAuthPersistStore';
import { useUploadPreviewUrl } from '@/hooks/use-upload-preview-url';

interface UserNavProps {
  className?: string;
}

export function UserNav({ className }: UserNavProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user } = useCurrentUser();
  const authPersistStore = useAuthPersistStore();

  const identity = React.useMemo(() => identifyUser(user), [user]);
  const avatarIdentity = React.useMemo(() => identifyUserAvatar(user), [user]);
  const profilePictureUrl = useUploadPreviewUrl({
    id: user?.profile?.pictureId,
    slug: user?.profile?.picture?.slug
  });

  const handleSignOut = async () => {
    authPersistStore.logout();
    await signOut({ callbackUrl: '/auth' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(className)}>
        <Avatar className="h-8 w-8 rounded-full">
          {profilePictureUrl && (
            <AvatarImage src={profilePictureUrl} alt={identity} className="object-cover" />
          )}
          <AvatarFallback>{avatarIdentity}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side={'bottom'}
        align="center"
        sideOffset={10}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              {profilePictureUrl && (
                <AvatarImage src={profilePictureUrl} alt={identity} className="object-cover" />
              )}
              <AvatarFallback className="rounded-lg">{avatarIdentity}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{identity}</span>
              <span className="truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/settings/account/profile')}>
            <User />
            {t('buttons.profile')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings />
            {t('buttons.settings')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut />
          {t('buttons.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

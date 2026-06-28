import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/content/user/useCurrentUser';
import { identifyUser, identifyUserAvatar } from '@/lib/user';
import { useUploadPreviewUrl } from '@/hooks/use-upload-preview-url';

export function UserSidebarMenu() {
  const { user } = useCurrentUser();

  const identity = React.useMemo(() => identifyUser(user), [user]);
  const avatarIdentity = React.useMemo(() => identifyUserAvatar(user), [user]);
  const profilePictureUrl = useUploadPreviewUrl({
    id: user?.profile?.pictureId,
    slug: user?.profile?.picture?.slug
  });

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent active:bg-transparent"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            {profilePictureUrl && (
              <AvatarImage src={profilePictureUrl} alt={identity} className="object-cover" />
            )}
            <AvatarFallback className="rounded-lg">{avatarIdentity}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{identity}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

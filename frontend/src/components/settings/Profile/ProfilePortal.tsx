import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw, Save } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useCurrentUser } from '@/hooks/content/user/useCurrentUser';
import { useUserStore } from '@/hooks/stores/useUserStore';
import useInitializedState from '@/hooks/use-initialized-state';
import { identifyUserAvatar } from '@/lib/user';
import { cn } from '@/lib/utils';
import { ChangeCurrentPasswordDto, UpdateCurrentProfileDto } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { getPasswordValidationKey } from '@/utils/password.utils';
import { GeneralInformation } from './forms/GeneralInformation';
import { ProfileInformation } from './forms/ProfileInformation';
import { ProfilePicture } from './forms/ProfilePicture';
import { SecurityInformation } from './forms/SecurityInformation';

interface ProfilePortalProps {
  className?: string;
}

const toOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const getAge = (date: Date) => {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
};

export const ProfilePortal = ({ className }: ProfilePortalProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userStore = useUserStore();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes, clearRoutes } = useBreadcrumb();
  const { user, isFetchUserPending, refetchUser } = useCurrentUser();
  const avatarIdentity = React.useMemo(() => identifyUserAvatar(user), [user]);

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings') },
      { title: tCommon('submenu.account') },
      { title: tCommon('settings.account.my_profile') }
    ]);
    return () => clearRoutes?.();
  }, [router.locale, setRoutes, clearRoutes, tCommon]);

  const { isDisabled, globalReset, setInitialData } = useInitializedState({
    data: user,
    getCurrentData: () => userStore.getUser(),
    setFormData: (data) => userStore.setUser(data),
    resetData: () => userStore.reset(),
    loading: isFetchUserPending
  });

  const buildProfilePayload = React.useCallback(async (): Promise<UpdateCurrentProfileDto> => {
    const data = userStore.getUser();
    let pictureId = data.pictureId;

    if (data.picture) {
      const uploaded = await api.upload.uploadFile(data.picture);
      pictureId = uploaded?.id;
    }

    return {
      firstName: toOptionalString(data.firstName),
      lastName: toOptionalString(data.lastName),
      username: toOptionalString(data.username),
      email: toOptionalString(data.email),
      dateOfBirth: data.dateOfBirth?.toISOString(),
      profile: {
        phone: toOptionalString(data.phone),
        cin: toOptionalString(data.cin),
        bio: toOptionalString(data.bio),
        gender: data.gender,
        isPrivate: data.isPrivate,
        pictureId
      }
    };
  }, [userStore]);

  const { mutateAsync: updateProfile, isPending: isUpdateProfilePending } = useMutation({
    mutationFn: async () => {
      const payload = await buildProfilePayload();
      const updatedUser = await api.user.updateCurrentProfile(payload);
      return { payload, updatedUser };
    },
    onSuccess: async ({ payload }) => {
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await refetchUser();
      userStore.set('picture', undefined);
      userStore.set('pictureId', payload.profile?.pictureId);
      toast.success(tSettings('profile.messages.profile_update_success'));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          'settings',
          error as Error,
          tSettings('profile.messages.profile_update_error')
        )
      );
    }
  });

  const { mutateAsync: changePassword, isPending: isChangePasswordPending } = useMutation({
    mutationFn: (data: ChangeCurrentPasswordDto) => api.user.changeCurrentPassword(data),
    onSuccess: async () => {
      userStore.set('currentPassword', '');
      userStore.set('password', '');
      userStore.set('confirmPassword', '');
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success(tSettings('profile.messages.password_update_success'));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          'settings',
          error as Error,
          tSettings('profile.messages.password_update_error')
        )
      );
    }
  });

  const validateProfile = () => {
    const data = userStore.getUser();

    if (!data.firstName?.trim()) return tSettings('profile.validation.first_name_required');
    if (!data.lastName?.trim()) return tSettings('profile.validation.last_name_required');
    if (!data.username?.trim() || data.username.trim().length < 3) {
      return tSettings('profile.validation.invalid_username');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim())) {
      return tSettings('profile.validation.invalid_username_format');
    }
    if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      return tSettings('profile.validation.invalid_email');
    }
    if (data.dateOfBirth && getAge(data.dateOfBirth) < 13) {
      return tSettings('profile.validation.age_minimum');
    }
    if (data.phone?.trim() && data.phone.trim().replace(/[^\d+]/g, '').length < 8) {
      return tSettings('profile.validation.invalid_phone');
    }
    if (data.cin?.trim() && !/^\d{8}$/.test(data.cin.trim())) {
      return tSettings('profile.validation.invalid_cin');
    }

    return null;
  };

  const getPasswordPayload = (): ChangeCurrentPasswordDto | null => {
    const data = userStore.getUser();
    const currentPassword = data.currentPassword || '';
    const newPassword = data.password || '';
    const confirmPassword = data.confirmPassword || '';
    const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);

    if (!wantsPasswordChange) return null;

    if (!currentPassword.trim()) {
      throw new Error(tSettings('profile.validation.current_password_required'));
    }

    const passwordValidationKey = getPasswordValidationKey(newPassword);
    if (passwordValidationKey) {
      throw new Error(tCommon(`auth.validation.${passwordValidationKey}`));
    }

    if (!confirmPassword.trim()) {
      throw new Error(tSettings('profile.validation.confirm_password_required'));
    }

    if (newPassword !== confirmPassword) {
      throw new Error(tSettings('profile.validation.passwords_do_not_match'));
    }

    return {
      currentPassword,
      newPassword
    };
  };

  const handleSubmit = async () => {
    const profileValidationMessage = validateProfile();
    if (profileValidationMessage) {
      toast.error(profileValidationMessage);
      return;
    }

    let passwordPayload: ChangeCurrentPasswordDto | null = null;
    try {
      passwordPayload = getPasswordPayload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tSettings('profile.messages.password_update_error')
      );
      return;
    }

    try {
      await updateProfile();
      if (passwordPayload) await changePassword(passwordPayload);
      setInitialData(userStore.getUser());
    } catch {
      // Mutations show their own localized toast.
    }
  };

  const loading = isFetchUserPending || isUpdateProfilePending || isChangePasswordPending;
  const hasPendingChanges = !isDisabled && !loading;
  const saveStatusLabel = loading
    ? tSettings('profile.status.saving')
    : hasPendingChanges
      ? tSettings('profile.status.unsaved')
      : tSettings('profile.status.saved');

  if (isFetchUserPending && !user) {
    return <Spinner className="h-full min-h-[360px]" show />;
  }

  return (
    <div className={cn('flex flex-1 flex-col overflow-auto py-6', className)}>
      <div className="flex w-full max-w-none flex-col gap-6 pb-8">
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-md px-5"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon('commands.back')}
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {tSettings('profile.title')}
            </h1>
            <p className="text-base text-zinc-500 dark:text-zinc-400">
              {tSettings('profile.description')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200">
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  loading ? 'bg-amber-500' : hasPendingChanges ? 'bg-primary' : 'bg-emerald-500'
                )}
              />
              <span className="truncate">{saveStatusLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-md px-5"
                onClick={globalReset}
                disabled={isDisabled || loading}
              >
                <RotateCcw className="mr-2 size-4" />
                {tCommon('commands.reset')}
              </Button>
              <Button
                type="button"
                className="h-11 rounded-md px-5"
                onClick={handleSubmit}
                disabled={isDisabled || loading}
              >
                <Spinner
                  className="mr-2"
                  size="small"
                  show={isUpdateProfilePending || isChangePasswordPending}
                />
                {!isUpdateProfilePending && !isChangePasswordPending && (
                  <Save className="mr-2 size-4" />
                )}
                {tCommon('commands.save')}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            <GeneralInformation isPending={loading} />
            <ProfileInformation isPending={loading} />
          </div>
          <aside className="flex min-w-0 flex-col gap-5">
            <ProfilePicture
              fallback={avatarIdentity}
              isPending={loading}
              pictureId={user?.profile?.pictureId}
              pictureSlug={user?.profile?.picture?.slug}
            />
            <SecurityInformation isPending={loading} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProfilePortal;

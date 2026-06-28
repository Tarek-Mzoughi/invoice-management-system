import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { PasswordField } from '@/components/shared/form-builder/PasswordField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/content/user/useCurrentUser';
import { getErrorMessage } from '@/utils/errors';
import type { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ShieldAlert } from 'lucide-react';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'fr', ['common', 'settings'])),
  },
});

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_PASSWORDS: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { user, isFetchUserPending } = useCurrentUser();

  const [form, setForm] = React.useState<PasswordFormState>(EMPTY_PASSWORDS);

  const updateField = (field: keyof PasswordFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!form.currentPassword.trim()) {
      return tSettings('profile.validation.current_password_required');
    }

    if (form.newPassword.length < 8) {
      return tSettings('profile.validation.new_password_min_length');
    }

    if (!form.confirmPassword.trim()) {
      return tSettings('profile.validation.confirm_password_required');
    }

    if (form.newPassword !== form.confirmPassword) {
      return tSettings('profile.validation.passwords_do_not_match');
    }

    return null;
  };

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.user.changeCurrentPassword(data),
    onSuccess: async () => {
      setForm(EMPTY_PASSWORDS);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success(tSettings('profile.messages.password_update_success'));
      router.replace('/dashboard');
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('settings', error, tSettings('profile.messages.password_update_error'))
      );
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validate();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  };

  if (isFetchUserPending && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner show />
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md rounded-lg border-zinc-200 shadow-sm dark:border-zinc-800">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {tSettings('profile.sections.password')}
          </CardTitle>
          <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
            Your account requires a password update for security reasons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="current-password">
                {tSettings('profile.attributes.current_password')}
              </Label>
              <PasswordField
                id="current-password"
                value={form.currentPassword}
                onChange={(event) => updateField('currentPassword', event.target.value)}
                placeholder={tSettings('profile.placeholders.current_password')}
                autoComplete="current-password"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">
                {tSettings('profile.attributes.new_password')}
              </Label>
              <PasswordField
                id="new-password"
                value={form.newPassword}
                onChange={(event) => updateField('newPassword', event.target.value)}
                placeholder={tSettings('profile.placeholders.new_password')}
                autoComplete="new-password"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {tSettings('profile.attributes.confirm_password')}
              </Label>
              <PasswordField
                id="confirm-password"
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder={tSettings('profile.placeholders.confirm_password')}
                autoComplete="new-password"
                disabled={isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-md"
              disabled={isPending}>
              {tCommon('commands.save')}
              <Spinner className="ml-2" size="small" show={isPending} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

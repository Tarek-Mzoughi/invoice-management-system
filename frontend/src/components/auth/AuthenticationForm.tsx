import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SignupPayload } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SignupForm, SignupFormData } from './SignupForm';
import {
  EMAIL_VERIFICATION_PROMPT,
  isEmailNotVerifiedError,
  RESEND_VERIFICATION_LABEL,
  RESEND_VERIFICATION_PENDING_LABEL
} from './auth-verification';

interface AuthenticationFormProps {
  className?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string | string[]; error?: string }>(error)) {
    const message = error.response?.data?.message || error.response?.data?.error;
    return Array.isArray(message) ? message[0] : message || fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
};

export function AuthenticationForm({ className }: AuthenticationFormProps) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const router = useRouter();
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  const [usernameOrEmail, setUsernameOrEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [unverifiedIdentifier, setUnverifiedIdentifier] = React.useState('');

  const { mutate: signInMutator, isPending: isSignInPending } = useMutation({
    mutationFn: async (data: { usernameOrEmail: string; password: string }) => {
      const result = await signIn('credentials', {
        redirect: false,
        callbackUrl: '/dashboard',
        usernameOrEmail: data.usernameOrEmail,
        password: data.password
      });
      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['current-user'] });
      setUnverifiedIdentifier('');
      toast.success(t('auth.login_success'));
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, t('auth.generic_error'));
      if (isEmailNotVerifiedError(message)) {
        setUnverifiedIdentifier(usernameOrEmail.trim());
      } else {
        setUnverifiedIdentifier('');
      }
      toast.error(message);
    }
  });

  const { mutate: signUpMutator, isPending: isSignUpPending } = useMutation({
    mutationFn: async (data: SignupFormData) => {
      let profilePictureId: number | undefined;
      let profilePictureUploadFailed = false;

      if (data.profilePicture) {
        try {
          const uploadedFile = await api.upload.uploadTemporaryFile(data.profilePicture);
          profilePictureId = uploadedFile?.id;
        } catch (error) {
          console.error('Failed to upload profile picture:', error);
          profilePictureUploadFailed = true;
        }
      }

      const payload: SignupPayload = {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        profilePictureId,
        phone: data.phone,
        cin: data.cin,
        bio: data.bio,
        gender: data.gender,
        isPrivate: data.isPrivate
      };

      const response = await api.auth.signUp(payload);
      return { response, profilePictureUploadFailed };
    },
    onSuccess: async (data, variables) => {
      queryClient.removeQueries({ queryKey: ['current-user'] });
      toast.success(t('auth.signup_success'));
      if (data.profilePictureUploadFailed) {
        toast.warning(t('auth.profile_picture_upload_warning'));
      }
      toast.info('A verification email has been sent to your inbox.', { duration: 6000 });
      setUsernameOrEmail(variables.email);
      setMode('login');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, t('auth.signup_error')));
    }
  });

  const { mutate: resendVerification, isPending: isResendVerificationPending } = useMutation({
    mutationFn: async () => api.auth.resendVerification(unverifiedIdentifier),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, t('auth.generic_error')));
    }
  });

  const handleSignIn = () => {
    if (!usernameOrEmail.trim() || !password.trim()) {
      toast.error(t('auth.validation.login_required'));
      return;
    }
    signInMutator({ usernameOrEmail: usernameOrEmail.trim(), password });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSignInPending) {
      handleSignIn();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignInPending) return;
    handleSignIn();
  };

  if (mode === 'signup') {
    return (
      <SignupForm
        className={className}
        onSubmit={(data) => signUpMutator(data)}
        isPending={isSignUpPending}
        onBackToLogin={() => setMode('login')}
      />
    );
  }

  return (
    <div className={cn('flex w-full max-w-md flex-col gap-6', className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{t('auth.login_title')}</h1>
        <p className="text-balance text-sm text-muted-foreground">{t('auth.login_description')}</p>
      </div>

      <form onSubmit={handleFormSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">{t('auth.email_or_username')}</Label>
          <Input
            id="email"
            type="text"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSignInPending}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="ml-auto text-sm text-primary underline-offset-4 hover:underline"
            >
              {t('auth.forgot_password')}
            </button>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSignInPending}
          />
        </div>

        {unverifiedIdentifier && (
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>{EMAIL_VERIFICATION_PROMPT}</p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSignInPending || isResendVerificationPending}
              onClick={() => resendVerification()}
            >
              {isResendVerificationPending
                ? RESEND_VERIFICATION_PENDING_LABEL
                : RESEND_VERIFICATION_LABEL}
            </Button>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSignInPending}>
          {t('auth.login_action')}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        {t('auth.no_account')}{' '}
        <button
          type="button"
          onClick={() => setMode('signup')}
          className="text-primary underline-offset-4 transition-colors hover:underline"
        >
          {t('auth.go_signup')}
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { toast } from 'sonner';
import { PasswordField } from '../shared/form-builder/PasswordField';
import { getPasswordValidationKey } from '@/utils/password.utils';
import { useTranslation } from 'react-i18next';

interface ResetPasswordFormProps {
  className?: string;
  token: string | null;
  goToAuthentication: () => void;
}

export const ResetPasswordForm = ({
  className,
  token,
  goToAuthentication
}: ResetPasswordFormProps) => {
  const { t } = useTranslation('common');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isResetComplete, setIsResetComplete] = React.useState(false);

  const {
    isFetching: isCheckingToken,
    isSuccess: isTokenValid,
    isError: isTokenInvalid
  } = useQuery({
    queryKey: ['checkResetToken', token],
    queryFn: async () => api.auth.checkResetToken(token as string),
    enabled: !!token,
    retry: false
  });

  const { mutate: resetPassword, isPending: isResetPending } = useMutation({
    mutationFn: async () => api.auth.resetPassword(token as string, password),
    onSuccess: (data) => {
      toast.success(data.message);
      setIsResetComplete(true);
    },
    onError: () => {
      toast.error('Failed to reset password');
    }
  });

  const handleSubmit = async () => {
    if (!token || !isTokenValid) {
      toast.error('Invalid or expired reset link');
      return;
    }
    if (!password) {
      toast.error('Please enter a password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordValidationKey = getPasswordValidationKey(password);
    if (passwordValidationKey) {
      toast.error(t(`auth.validation.${passwordValidationKey}`));
      return;
    }

    resetPassword();
  };

  if (!token || isTokenInvalid) {
    return (
      <div className={cn('flex flex-col gap-6 w-[350px]', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-balance text-sm text-muted-foreground">
            This reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <Button className="w-full" onClick={goToAuthentication}>
          Back to login
        </Button>
      </div>
    );
  }

  if (isCheckingToken || (!isTokenValid && !isResetComplete)) {
    return (
      <div className={cn('flex flex-col gap-6 w-[350px]', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Checking reset link...</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Please wait while we validate your password reset link.
          </p>
        </div>
      </div>
    );
  }

  if (isResetComplete) {
    return (
      <div className={cn('flex flex-col gap-6 w-[350px]', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Password reset</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Your password has been reset successfully. You can now log in.
          </p>
        </div>
        <Button className="w-full" onClick={goToAuthentication}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6 w-[350px]', className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordField
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isResetPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <PasswordField
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isResetPending}
          />
        </div>
        {password && confirmPassword && password !== confirmPassword && (
          <span className="font-medium text-xs text-red-500 leading-3">
            Password does not match
          </span>
        )}
        <p className="text-xs text-muted-foreground">{t('auth.password_hint')}</p>

        <div className="flex flex-row gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={goToAuthentication}
            disabled={isResetPending}>
            Cancel
          </Button>
          <Button className="w-full" onClick={handleSubmit} disabled={isResetPending}>
            {isResetPending ? 'Resetting...' : 'Reset'}
          </Button>
        </div>
      </div>
    </div>
  );
};

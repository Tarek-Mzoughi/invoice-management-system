import React from 'react';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface VerifyEmailFormProps {
  className?: string;
  token: string | null;
  goToAuthentication: () => void;
}

export const VerifyEmailForm = ({
  className,
  token,
  goToAuthentication
}: VerifyEmailFormProps) => {
  const [usernameOrEmail, setUsernameOrEmail] = React.useState('');

  const {
    isFetching: isVerifying,
    isSuccess,
    isError
  } = useQuery({
    queryKey: ['verifyEmail', token],
    queryFn: async () => api.auth.verifyEmail(token as string),
    enabled: !!token,
    retry: false
  });

  const { mutate: resendVerification, isPending: isResending } = useMutation({
    mutationFn: async () => api.auth.resendVerification(usernameOrEmail.trim()),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: () => {
      toast.error('Unable to resend verification email. Please try again.');
    }
  });

  const handleResend = () => {
    if (!usernameOrEmail.trim()) {
      toast.error('Please enter your email or username.');
      return;
    }

    resendVerification();
  };

  if (token && (isVerifying || (!isSuccess && !isError))) {
    return (
      <div className={cn('flex flex-col gap-6 w-[350px]', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Verifying email...</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={cn('flex flex-col gap-6 w-[350px]', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Email verified</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Your email has been verified successfully. You can now log in.
          </p>
        </div>
        <Button className="w-full" onClick={goToAuthentication}>
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6 w-[350px]', className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {isError || !token ? 'Verification failed' : 'Verify your email'}
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          {isError || !token
            ? 'This verification link is invalid or has expired.'
            : 'Use the link from your email to verify your account.'}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="verification-email">Email/Username</Label>
          <Input
            id="verification-email"
            type="text"
            placeholder="Please enter your email or username"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            disabled={isResending}
          />
        </div>

        <div className="flex flex-row gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={goToAuthentication}
            disabled={isResending}>
            Back
          </Button>
          <Button className="w-full" onClick={handleResend} disabled={isResending}>
            {isResending ? 'Sending...' : 'Resend verification email'}
          </Button>
        </div>
      </div>
    </div>
  );
};

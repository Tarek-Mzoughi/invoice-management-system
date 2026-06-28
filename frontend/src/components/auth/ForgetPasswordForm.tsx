import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api';

interface ForgotPasswordFormProps {
  className?: string;
  goToAuthentication: () => void;
}

export const ForgotPasswordForm = ({
  className,
  goToAuthentication
}: ForgotPasswordFormProps) => {
  const [usernameOrEmail, setUsernameOrEmail] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const { mutate: sendResetLink, isPending } = useMutation({
    mutationFn: async () => api.auth.forgetPassword({ usernameOrEmail: usernameOrEmail.trim() }),
    onSuccess: (data) => {
      toast.success(data.message);
      setIsSubmitted(true);
    },
    onError: () => {
      toast.error('Unable to request a reset link. Please try again.');
    }
  });

  const handleSubmit = async () => {
    if (!usernameOrEmail.trim()) {
      toast.error('Please enter your email or username to receive a reset link.');
      return;
    }
    sendResetLink();
  };

  if (isSubmitted) {
    return (
      <div className={cn('flex flex-col gap-6 w-[350px]', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-balance text-sm text-muted-foreground">
            If an account exists, a password reset link has been sent.
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
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email or username to receive a reset link.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email/Username</Label>
          <Input
            id="email"
            type="text"
            placeholder="Please enter your email or username"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-row gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={goToAuthentication}
            disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="w-full" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import Image from 'next/image';
import { AuthenticationForm } from './AuthenticationForm';
import { Box } from 'lucide-react';
import { ForgotPasswordForm } from './ForgetPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { VerifyEmailForm } from './VerifyEmailForm';
import { clearQueryParams } from '@/lib/url.lib';
import { useRouter } from 'next/router';
import OnBoarding from '@/assets/on-boarding.jpg';

export type AuthScreen = 'login' | 'forgot-password' | 'reset-password' | 'verify-email';

interface AuthenticationLayoutProps {
  initialScreen?: AuthScreen;
}

const isAuthScreen = (screen: string | string[] | undefined): screen is AuthScreen =>
  typeof screen === 'string' &&
  ['login', 'forgot-password', 'reset-password', 'verify-email'].includes(screen);

const getQueryParam = (value: string | string[] | undefined): string | null =>
  typeof value === 'string' ? value : null;

export const AuthenticationLayout = ({ initialScreen }: AuthenticationLayoutProps) => {
  const router = useRouter();
  const [target, setTarget] = React.useState<AuthScreen>(initialScreen || 'login');

  const screenParam = router.query.target;
  const tokenParam = getQueryParam(router.query.token);

  React.useEffect(() => {
    if (initialScreen) {
      setTarget(initialScreen);
      return;
    }

    if (isAuthScreen(screenParam)) {
      setTarget(screenParam);
      return;
    }

    setTarget('login');
  }, [initialScreen, screenParam]);

  const goToAuthentication = () => {
    setTarget('login');
    if (router.pathname === '/auth') {
      clearQueryParams(router);
      return;
    }
    router.push('/auth');
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2 no-select">
      <div className="flex flex-col gap-4 p-6 md:p-10 overflow-auto">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Box size={24} />
            </div>
            Invoicing System
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full">
            <div className="bg-background flex flex-col items-center gap-4 justify-center h-full my-4">
              {target === 'login' && <AuthenticationForm />}
              {target === 'forgot-password' && (
                <ForgotPasswordForm goToAuthentication={goToAuthentication} />
              )}
              {target === 'reset-password' && (
                <ResetPasswordForm
                  goToAuthentication={goToAuthentication}
                  token={tokenParam}
                />
              )}
              {target === 'verify-email' && (
                <VerifyEmailForm goToAuthentication={goToAuthentication} token={tokenParam} />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src={OnBoarding}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover grayscale"
          draggable="false"
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
    </div>
  );
};

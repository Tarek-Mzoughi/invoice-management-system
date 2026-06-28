import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useAuthPersistStore } from '@/hooks/stores/useAuthPersistStore';

export const useAuthSyncStatus = () => {
  const { data: rawSession, status } = useSession();
  const session = (rawSession as Session | null) || null;

  const storeReady = useAuthPersistStore((state) => state._ready);
  const accessToken = useAuthPersistStore((state) => state.accessToken);
  const refreshToken = useAuthPersistStore((state) => state.refreshToken);

  const sessionAccessToken = session?.user?.access_token || '';
  const sessionRefreshToken = session?.user?.refresh_token || '';
  const hasSessionTokens = Boolean(sessionAccessToken && sessionRefreshToken);
  const isProtectedDataReady =
    storeReady &&
    status === 'authenticated' &&
    hasSessionTokens &&
    accessToken === sessionAccessToken &&
    refreshToken === sessionRefreshToken;

  return {
    session,
    status,
    storeReady,
    accessToken,
    refreshToken,
    sessionAccessToken,
    sessionRefreshToken,
    hasSessionTokens,
    isProtectedDataReady
  };
};

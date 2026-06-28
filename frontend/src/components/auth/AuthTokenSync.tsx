import React from 'react';
import { useAuthPersistStore } from '@/hooks/stores/useAuthPersistStore';
import { useAuthSyncStatus } from '@/hooks/other/useAuthSyncStatus';

export function AuthTokenSync() {
  const {
    status,
    hasSessionTokens,
    accessToken,
    refreshToken,
    sessionAccessToken,
    sessionRefreshToken
  } = useAuthSyncStatus();

  const isAuthenticated = useAuthPersistStore((state) => state.isAuthenticated);
  const setAccessToken = useAuthPersistStore((state) => state.setAccessToken);
  const setRefreshToken = useAuthPersistStore((state) => state.setRefreshToken);
  const setAuthenticated = useAuthPersistStore((state) => state.setAuthenticated);
  const logout = useAuthPersistStore((state) => state.logout);

  React.useEffect(() => {
    if (status === 'authenticated' && hasSessionTokens) {
      if (accessToken !== sessionAccessToken) {
        setAccessToken(sessionAccessToken);
      }

      if (refreshToken !== sessionRefreshToken) {
        setRefreshToken(sessionRefreshToken);
      }

      if (!isAuthenticated) {
        setAuthenticated(true);
      }

      return;
    }

    if (
      status === 'authenticated' &&
      !hasSessionTokens &&
      (isAuthenticated || accessToken || refreshToken)
    ) {
      logout();
      return;
    }

    if (status === 'unauthenticated' && (isAuthenticated || accessToken || refreshToken)) {
      logout();
    }
  }, [
    accessToken,
    hasSessionTokens,
    isAuthenticated,
    logout,
    refreshToken,
    sessionAccessToken,
    sessionRefreshToken,
    setAccessToken,
    setAuthenticated,
    setRefreshToken,
    status
  ]);

  return null;
}

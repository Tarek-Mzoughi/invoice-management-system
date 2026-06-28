import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { useAuthSyncStatus } from '@/hooks/other/useAuthSyncStatus';

interface useCurrentUserProps {
  enabled?: boolean;
}

export const useCurrentUser = ({ enabled }: useCurrentUserProps = { enabled: true }) => {
  const { isProtectedDataReady } = useAuthSyncStatus();
  const [hasCompletedOnce, setHasCompletedOnce] = React.useState(false);

  const {
    data: userResp,
    isFetching,
    isError,
    isSuccess,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.user.findCurrent(),
    enabled: Boolean(enabled) && isProtectedDataReady,
    retry: false
  });

  React.useEffect(() => {
    if (isSuccess || isError) {
      setHasCompletedOnce(true);
    }
  }, [isSuccess, isError]);

  React.useEffect(() => {
    if (!Boolean(enabled) || !isProtectedDataReady) {
      setHasCompletedOnce(false);
    }
  }, [enabled, isProtectedDataReady]);

  const isFetchUserPending = !hasCompletedOnce && isFetching;

  const user = React.useMemo(() => {
    if (!userResp) return null;
    return userResp;
  }, [userResp]);

  return {
    user,
    isFetchUserPending,
    refetchUser
  };
};

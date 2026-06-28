import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { useActiveCabinet } from './useCabinetSwitcher';
import { useCurrentUser } from './user/useCurrentUser';

const useCabinet = (enabled: boolean = true) => {
  const { user, isFetchUserPending } = useCurrentUser({ enabled });
  const { activeCabinet } = useActiveCabinet();
  const activeCabinetId = activeCabinet?.id;
  const {
    isPending: isFetchCabinetPending,
    error,
    data: cabinetResp,
    refetch: refetchCabinet
  } = useQuery({
    queryKey: ['cabinet', activeCabinetId],
    queryFn: () => api.cabinet.findOne(activeCabinetId as number, 'indeed'),
    enabled: Boolean(enabled && activeCabinetId && !user?.onboardingRequired)
  });

  const cabinet = React.useMemo(() => {
    if (cabinetResp) return cabinetResp;
    if (activeCabinet?.id === activeCabinetId) return activeCabinet;
    return null;
  }, [activeCabinet, activeCabinetId, cabinetResp]);

  return {
    cabinet,
    isFetchCabinetPending: isFetchUserPending || isFetchCabinetPending,
    error,
    refetchCabinet
  };
};

export default useCabinet;

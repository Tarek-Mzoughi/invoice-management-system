import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useActivities = (enabled: boolean = true) => {
  const { isPending: isFetchActivitiesPending, data: activitiesResp } = useQuery({
    queryKey: ['activities'],
    queryFn: () => api.activity.find(),
    enabled
  });

  const activities = React.useMemo(() => {
    if (!activitiesResp) return [];
    return activitiesResp;
  }, [activitiesResp]);

  return {
    activities,
    isFetchActivitiesPending
  };
};

export default useActivities;

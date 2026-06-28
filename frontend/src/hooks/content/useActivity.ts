import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useActivity = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchActivityPending, data: activityResp } = useQuery({
    queryKey: [`activity-${id}`],
    queryFn: () => api.activity.findOne(id),
    enabled: !!id && enabled
  });

  const activity = React.useMemo(() => {
    if (!activityResp) return null;
    return activityResp;
  }, [activityResp]);

  return {
    activity,
    isFetchActivityPending
  };
};

export default useActivity;

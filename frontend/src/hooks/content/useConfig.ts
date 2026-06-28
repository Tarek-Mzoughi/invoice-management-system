import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useConfig = (keys?: string[], enabled: boolean = true) => {
  const {
    isPending: isConfigPending,
    data,
    refetch: refetchConfig
  } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => api.appConfig.find(keys),
    enabled
  });

  const configs = React.useMemo(() => {
    if (!data) return [];
    return data.map((config) => {
      return config;
    });
  }, [data]);

  return {
    configs,
    isConfigPending,
    refetchConfig
  };
};

export default useConfig;

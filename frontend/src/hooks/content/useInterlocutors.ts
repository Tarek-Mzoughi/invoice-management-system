import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useInterlocutors = (params?: string, enabled: boolean = true) => {
  const {
    isFetching: isFetchInterlocutorsPending,
    data: interlocutorsResp,
    refetch: refetchInterloctors
  } = useQuery({
    queryKey: ['interlocutor-choices', params],
    queryFn: () => api.interlocutor.findAll(params),
    enabled
  });

  const interlocutors = React.useMemo(() => {
    if (!interlocutorsResp) return [];
    return interlocutorsResp;
  }, [interlocutorsResp]);

  return {
    interlocutors,
    isFetchInterlocutorsPending,
    refetchInterloctors
  };
};

export default useInterlocutors;

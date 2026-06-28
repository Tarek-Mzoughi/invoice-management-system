import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useInterlocutor = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchInterlocutorPending, data: interlocutorResp } = useQuery({
    queryKey: [`interlocutor-${id}`],
    queryFn: () => api.interlocutor.findOne(id),
    enabled: !!id && enabled
  });

  const interlocutor = React.useMemo(() => {
    if (!interlocutorResp) return null;
    return interlocutorResp;
  }, [interlocutorResp]);

  return {
    interlocutor,
    isFetchInterlocutorPending
  };
};

export default useInterlocutor;

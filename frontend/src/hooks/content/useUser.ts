import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useUser = (id?: number, enabled: boolean = true) => {
  const { isPending: isFetchUserPending, data: userResp } = useQuery({
    queryKey: [`user-${id}`],
    queryFn: () => api.user.findById(id?.toString()),
    enabled: enabled && !!id
  });

  const user = React.useMemo(() => {
    if (!userResp) return null;
    return userResp;
  }, [userResp]);

  return {
    user,
    isFetchUserPending
  };
};

export default useUser;

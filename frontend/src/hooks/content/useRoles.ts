import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

export const useRoles = (enabled: boolean = true) => {
  const { isFetching: isFetchRolesPending, data: rolesResp } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.role.findAll(),
    enabled
  });

  const roles = React.useMemo(() => {
    if (!rolesResp) return [];
    return rolesResp;
  }, [rolesResp]);

  return {
    roles,
    isFetchRolesPending
  };
};

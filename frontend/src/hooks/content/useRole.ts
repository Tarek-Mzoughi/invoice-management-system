import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useRole = (id?: string, enabled: boolean = true) => {
  const { isPending: isFetchRolePending, data: roleResp } = useQuery({
    queryKey: [`role-${id}`],
    queryFn: () => api.role.findById(id),
    enabled: enabled && Boolean(id)
  });

  const role = React.useMemo(() => {
    if (!roleResp) return null;
    return roleResp;
  }, [roleResp]);

  return {
    role,
    isFetchRolePending
  };
};

export default useRole;

import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useFirm = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchFirmPending, data: firmResp } = useQuery({
    queryKey: [`firm-${id}`],
    queryFn: () => api.firm.findOne(id),
    enabled: !!id && enabled
  });

  const firm = React.useMemo(() => {
    if (!firmResp) return null;
    return firmResp;
  }, [firmResp]);

  return {
    firm,
    isFetchFirmPending
  };
};

export default useFirm;

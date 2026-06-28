import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { HookQueryOptions, normalizeHookQueryOptions } from './queryOptions';
import { useActiveCabinet } from './useCabinetSwitcher';

const useTax = (options?: boolean | HookQueryOptions) => {
  const { enabled, silentForbiddenToast } = normalizeHookQueryOptions(options);
  const { activeCabinet } = useActiveCabinet();

  const { isPending: isFetchTaxesPending, data: taxesResp } = useQuery({
    queryKey: ['taxes', activeCabinet?.id, 'active'],
    queryFn: () => api.tax.find({ silentForbiddenToast, activeOnly: true }),
    enabled: enabled && Boolean(activeCabinet?.id)
  });

  const taxes = React.useMemo(() => {
    if (!enabled || !activeCabinet?.id) return [];
    if (!taxesResp) return [];
    return taxesResp;
  }, [enabled, activeCabinet?.id, taxesResp]);

  return {
    taxes,
    isFetchTaxesPending: enabled ? isFetchTaxesPending : false
  };
};

export default useTax;

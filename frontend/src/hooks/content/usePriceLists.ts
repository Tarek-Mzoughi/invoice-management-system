import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { HookQueryOptions, normalizeHookQueryOptions } from './queryOptions';

const usePriceLists = (options?: boolean | HookQueryOptions) => {
  const { enabled, silentForbiddenToast } = normalizeHookQueryOptions(options);

  const { isFetching: isFetchPriceListsPending, data: priceListsResp } = useQuery({
    queryKey: ['price-lists'],
    queryFn: () => api.priceList.find({ silentForbiddenToast }),
    enabled
  });

  const priceLists = React.useMemo(() => {
    if (!enabled) return [];
    if (!priceListsResp) return [];
    return priceListsResp;
  }, [enabled, priceListsResp]);

  return {
    priceLists,
    isFetchPriceListsPending: enabled ? isFetchPriceListsPending : false
  };
};

export default usePriceLists;

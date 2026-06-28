import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { HookQueryOptions, normalizeHookQueryOptions } from './queryOptions';

const useTaxWithholding = (options?: boolean | HookQueryOptions) => {
  const { enabled, silentForbiddenToast } = normalizeHookQueryOptions(options);

  const { isPending: isFetchTaxWithholdingsPending, data: taxWithholdingResp } = useQuery({
    queryKey: ['tax-withholdings'],
    queryFn: () => api.taxWithholding.find({ silentForbiddenToast }),
    enabled
  });

  const taxWithholdings = React.useMemo(() => {
    if (!enabled) return [];
    if (!taxWithholdingResp) return [];
    return taxWithholdingResp;
  }, [enabled, taxWithholdingResp]);

  return {
    taxWithholdings,
    isFetchTaxWithholdingsPending: enabled ? isFetchTaxWithholdingsPending : false
  };
};

export default useTaxWithholding;

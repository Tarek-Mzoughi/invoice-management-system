import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { HookQueryOptions, normalizeHookQueryOptions } from './queryOptions';

const usePaymentCondition = (options?: boolean | HookQueryOptions) => {
  const { enabled, silentForbiddenToast } = normalizeHookQueryOptions(options);

  const { isPending: isFetchPaymentConditionsPending, data: paymentConditionsResp } = useQuery({
    queryKey: ['payment-conditions'],
    queryFn: () => api.paymentCondition.find({ silentForbiddenToast }),
    enabled
  });

  const paymentConditions = React.useMemo(() => {
    if (!enabled) return [];
    if (!paymentConditionsResp) return [];
    return paymentConditionsResp;
  }, [enabled, paymentConditionsResp]);

  return {
    paymentConditions,
    isFetchPaymentConditionsPending: enabled ? isFetchPaymentConditionsPending : false
  };
};

export default usePaymentCondition;

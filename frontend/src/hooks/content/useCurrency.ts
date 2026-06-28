import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useCurrency = (enabled: boolean = true) => {
  const { isPending: isFetchCurrenciesPending, data: currenciesResp } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.currency.find(),
    enabled
  });

  const currencies = React.useMemo(() => {
    if (!currenciesResp) return [];
    return currenciesResp;
  }, [currenciesResp]);

  return {
    currencies,
    isFetchCurrenciesPending
  };
};

export default useCurrency;

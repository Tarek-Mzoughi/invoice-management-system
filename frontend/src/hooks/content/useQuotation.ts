import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useQuotation = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchQuotationPending, data: quotationResp } = useQuery({
    queryKey: [`quotation-${id}`],
    queryFn: () => api.quotation.findOne(id),
    enabled: !!id && enabled
  });

  const quotation = React.useMemo(() => {
    if (!quotationResp) return null;
    return quotationResp;
  }, [quotationResp]);

  return {
    quotation,
    isFetchQuotationPending
  };
};

export default useQuotation;

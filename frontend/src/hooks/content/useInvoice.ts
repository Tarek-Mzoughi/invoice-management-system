import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useInvoice = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchInvoicePending, data: invoiceResp } = useQuery({
    queryKey: [`invoice-${id}`],
    queryFn: () => api.invoice.findOne(id),
    enabled: !!id && enabled
  });

  const invoice = React.useMemo(() => {
    if (!invoiceResp) return null;
    return invoiceResp;
  }, [invoiceResp]);

  return {
    invoice,
    isFetchInvoicePending
  };
};

export default useInvoice;

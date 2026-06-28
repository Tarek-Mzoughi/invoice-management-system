import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const usePayment = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchPaymentPending, data: paymentResp } = useQuery({
    queryKey: [`payment-${id}`],
    queryFn: () => api.payment.findOne(id),
    enabled: !!id && enabled
  });

  const payment = React.useMemo(() => {
    if (!paymentResp) return null;
    return paymentResp;
  }, [paymentResp]);

  return {
    payment,
    isFetchPaymentPending
  };
};

export default usePayment;

import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useCustomerOrderRangeDates = (id?: number, enabled: boolean = true) => {
  const { isLoading: isFetchCustomerOrderRangePending, data: customerOrderRangeResp } = useQuery({
    queryKey: [`customerOrder-range-${id}`],
    queryFn: () => api.customerOrder.findByRange(id),
    enabled: !!id && enabled
  });

  const dateRange = React.useMemo(() => {
    if (!customerOrderRangeResp) return {};
    //previous date
    const previousDate = customerOrderRangeResp.previous?.date
      ? new Date(customerOrderRangeResp.previous.date)
      : undefined;

    //next date
    const nextDate = customerOrderRangeResp.next?.date ? new Date(customerOrderRangeResp.next.date) : undefined;

    return {
      from: previousDate,
      to: nextDate
    };
  }, [customerOrderRangeResp]);

  return {
    dateRange,
    isFetchCustomerOrderRangePending
  };
};

export default useCustomerOrderRangeDates;

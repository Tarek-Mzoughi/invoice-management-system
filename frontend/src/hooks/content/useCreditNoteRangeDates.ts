import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useCreditNoteRangeDates = (id?: number, enabled: boolean = true) => {
  const { isLoading: isFetchCreditNoteRangePending, data: creditNoteRangeResp } = useQuery({
    queryKey: [`creditNote-range-${id}`],
    queryFn: () => api.creditNote.findByRange(id),
    enabled: !!id && enabled
  });

  const dateRange = React.useMemo(() => {
    if (!creditNoteRangeResp) return {};
    //previous date
    const previousDate = creditNoteRangeResp.previous?.date
      ? new Date(creditNoteRangeResp.previous.date)
      : undefined;

    //next date
    const nextDate = creditNoteRangeResp.next?.date ? new Date(creditNoteRangeResp.next.date) : undefined;

    return {
      from: previousDate,
      to: nextDate
    };
  }, [creditNoteRangeResp]);

  return {
    dateRange,
    isFetchCreditNoteRangePending
  };
};

export default useCreditNoteRangeDates;

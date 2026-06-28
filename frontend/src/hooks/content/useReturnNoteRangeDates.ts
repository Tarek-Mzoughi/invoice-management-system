import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useReturnNoteRangeDates = (id?: number, enabled: boolean = true) => {
  const { isLoading: isFetchReturnNoteRangePending, data: returnNoteRangeResp } = useQuery({
    queryKey: [`returnNote-range-${id}`],
    queryFn: () => api.returnNote.findByRange(id),
    enabled: !!id && enabled
  });

  const dateRange = React.useMemo(() => {
    if (!returnNoteRangeResp) return {};
    //previous date
    const previousDate = returnNoteRangeResp.previous?.date
      ? new Date(returnNoteRangeResp.previous.date)
      : undefined;

    //next date
    const nextDate = returnNoteRangeResp.next?.date ? new Date(returnNoteRangeResp.next.date) : undefined;

    return {
      from: previousDate,
      to: nextDate
    };
  }, [returnNoteRangeResp]);

  return {
    dateRange,
    isFetchReturnNoteRangePending
  };
};

export default useReturnNoteRangeDates;

import { api } from '@/api';
import { transformDateTime } from '@/utils/date.utils';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';

const useLogs = (
  sortKey?: string,
  order?: 'ASC' | 'DESC',
  startDate?: Date,
  endDate?: Date,
  events: string[] = [],
  enabled: boolean = true
) => {
  const startDateString = startDate ? transformDateTime(startDate.toISOString()) : undefined;
  const endDateString = endDate ? transformDateTime(endDate.toISOString()) : undefined;

  const [afterDate, setAfterDate] = useState<string>();

  const applyAfterDateFilter = React.useMemo(() => {
    return sortKey == 'loggedAt' && order == 'DESC';
  }, [sortKey, order]);

  const dateFilter = React.useMemo(() => {
    if (startDateString && endDateString) {
      return `loggedAt||$between||${startDateString},${endDateString}`;
    } else if (startDateString) {
      return applyAfterDateFilter
        ? `loggedAt||$between||${startDateString},${afterDate}`
        : `loggedAt||$gte||${startDateString}`;
    } else if (endDateString) {
      return `loggedAt||$lte||${endDateString}`;
    }
    return applyAfterDateFilter ? `loggedAt||$lte||${afterDate}` : '';
  }, [startDateString, endDateString, afterDate]);

  const eventFilter = React.useMemo(() => {
    if (events.length > 0) {
      return `event||$in||${events.join(',')}`;
    }
    return '';
  }, [events]);

  const { data: firstLog, isLoading: isFirstLogLoading } = useQuery({
    queryKey: ['logs', 'initial', sortKey, order, eventFilter],
    queryFn: () =>
      api.admin.logger.findPaginatedRawFunction({
        page: '1',
        limit: '1',
        sort: `${sortKey || 'loggedAt'},${order || 'DESC'}`,
        filter: `${eventFilter}`
      }),
    enabled
  });

  useEffect(() => {
    if (firstLog && firstLog.data.length > 0) {
      if (firstLog.data[0].loggedAt) setAfterDate(transformDateTime(firstLog.data[0].loggedAt));
    }
  }, [firstLog]);

  const {
    data,
    fetchNextPage: loadMoreLogs,
    hasNextPage,
    isPending,
    isFetchingNextPage,
    refetch: refetchLogs
  } = useInfiniteQuery({
    queryKey: ['logs', afterDate, sortKey, order, dateFilter, eventFilter],
    queryFn: ({ pageParam = 1 }) =>
      api.admin.logger.findPaginatedRawFunction({
        page: pageParam.toString(),
        limit: '50',
        sort: `${sortKey || 'loggedAt'},${order || 'DESC'}`,
        filter: `${dateFilter}${eventFilter ? ';' + eventFilter : ''}`,
        join: 'user'
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : null),
    enabled: enabled && !!afterDate
  });

  return {
    logs: data?.pages.flatMap((group) => group.data) || [],
    isPending: isPending || isFirstLogLoading || isFetchingNextPage,
    loadMoreLogs,
    hasNextPage,
    refetchLogs
  };
};

export default useLogs;

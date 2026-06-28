import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { useDebounce } from '@/hooks/other/useDebounce';
import type { FirmEntityType } from '@/types';
import type { FirmTypeFilter } from './firm-table.types';

export const useFirmList = (entityType: FirmEntityType) => {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(20);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<FirmTypeFilter>('all');

  const { value: debouncedSearchTerm, loading: searching } = useDebounce(searchTerm, 400);
  const { value: debouncedTypeFilter, loading: filtering } = useDebounce(typeFilter, 400);

  const query = useQuery({
    queryKey: ['firms', entityType, page, size, debouncedSearchTerm, debouncedTypeFilter],
    queryFn: () =>
      api.firm.findPaginated(page, size, 'DESC', 'createdAt', {
        search: debouncedSearchTerm,
        entityType,
        isPerson: debouncedTypeFilter === 'all' ? undefined : debouncedTypeFilter === 'person'
      })
  });

  const firms = React.useMemo(() => query.data?.data || [], [query.data]);
  const totalPageCount = query.data?.meta.pageCount || 0;
  const totalResultCount = query.data?.meta.itemCount || 0;

  React.useEffect(() => {
    if (totalPageCount > 0 && page > totalPageCount) {
      setPage(totalPageCount);
    }
  }, [page, totalPageCount]);

  return {
    debouncedTypeFilter,
    filtering,
    firms,
    hasActiveFilters: searchTerm.trim() !== '' || typeFilter !== 'all',
    isFetchPending: query.isPending,
    page,
    query,
    searchTerm,
    searching,
    setPage,
    setSearchTerm,
    setSize,
    setTypeFilter,
    size,
    totalPageCount,
    totalResultCount,
    typeFilter
  };
};


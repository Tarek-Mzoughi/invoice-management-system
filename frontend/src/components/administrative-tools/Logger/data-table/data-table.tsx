import React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';

import { DataTableToolbar } from './data-table-toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { PackageOpen, ArrowUp } from 'lucide-react';
import { Spinner } from '@/components/shared';
import { useDebounce } from '@/hooks/other/useDebounce';
import { Button } from '@/components/ui/button';
import { useLoggerActions } from './ActionsContext';
import { DataTablePagination } from './data-table-pagination';

interface DataTableProps<TData, TValue> {
  className?: string;
  containerClassName?: string;
  columns: ColumnDef<TData, TValue>[];
  httpLogs: TData[];
  socketLogs: TData[];
  hasNextPage: boolean;
  loadMoreLogs: () => void;
  isPending: boolean;
}

export function DataTable<TData, TValue>({
  className,
  containerClassName,
  columns,
  httpLogs,
  socketLogs,
  hasNextPage,
  loadMoreLogs,
  isPending
}: DataTableProps<TData, TValue>) {
  const { t: tCommon } = useTranslation('common');
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { value: debouncedPending, loading: pending } = useDebounce<boolean>(isPending, 1000);

  // Track new logs for scroll indicator
  const { newLogsCount, setNewLogsCount } = useLoggerActions();
  const [seenLogsCount, setSeenLogsCount] = React.useState(0);

  // Combine logs efficiently
  const combinedLogs = React.useMemo(() => {
    return [...socketLogs, ...httpLogs];
  }, [socketLogs, httpLogs]);

  // Update new logs count when socket logs change
  React.useEffect(() => {
    if (socketLogs.length > 0) {
      setNewLogsCount?.(socketLogs.length - seenLogsCount);
      if (tableContainerRef.current) {
        const container = tableContainerRef.current;
        const initialHeight = container.scrollHeight;
        const interval = setInterval(() => {
          if (container.scrollHeight > initialHeight) {
            container.scrollTo({
              top: container.scrollTop + (container.scrollHeight - initialHeight),
              behavior: 'smooth'
            });
            clearInterval(interval);
          }
        }, 50);

        return () => clearInterval(interval);
      }
    }
  }, [socketLogs, setNewLogsCount, seenLogsCount]);

  const handleScrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSeenLogsCount((prev) => prev + newLogsCount!);
    setNewLogsCount?.(0);
  };

  const table = useReactTable({
    data: combinedLogs,
    columns,
    state: {
      sorting,
      rowSelection,
      columnFilters
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  });

  React.useEffect(() => {
    table.setPageSize(combinedLogs.length);
  }, [combinedLogs, table]);

  React.useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (!tableContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = tableContainer;
      if (scrollTop + clientHeight >= scrollHeight - 10 && hasNextPage && !debouncedPending) {
        loadMoreLogs();
      }
      if (scrollTop < 50) {
        setSeenLogsCount((prev) => prev + newLogsCount!);
        setNewLogsCount?.(0);
      }
    };

    tableContainer.addEventListener('scroll', handleScroll);
    return () => tableContainer.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, debouncedPending, loadMoreLogs, newLogsCount, setNewLogsCount]);

  return (
    <div className={cn(className, 'space-y-6')}>
      <DataTableToolbar table={table} />
      <div
        ref={tableContainerRef}
        className={cn('rounded-md border overflow-auto', containerClassName)}>
        <Table className="relative">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ minWidth: `${header.getContext().column.getSize()}%` }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length
              ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {!(hasNextPage || pending) ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-16 text-center">
                  <div className="flex items-center justify-center gap-2 font-bold">
                    {tCommon('table.no_results')} <PackageOpen />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-16 text-center">
                  <div className="flex items-center justify-center gap-2 font-bold">
                    {tCommon('table.loading')} <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination scrollTop={handleScrollToTop} />
    </div>
  );
}

import React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
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
import { PackageOpen } from 'lucide-react';
import { Cross2Icon } from '@radix-ui/react-icons';

import { DataTablePagination } from './data-table-pagination';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/lib/utils';
import { DataTableConfig } from './types';
import { useTranslation } from 'react-i18next';
import { useFooter } from '@/context/FooterContext';

interface DataTableProps<TData, TValue> {
  className?: string;
  containerClassName?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  context: DataTableConfig<TData>;
  footerPagination?: boolean;
  isPending: boolean;
}

export function DataTable<TData, TValue>({
  className,
  containerClassName,
  columns,
  data,
  context,
  footerPagination = true,
  isPending
}: DataTableProps<TData, TValue>) {
  //set pagination in footer
  const { setContent } = useFooter();
  const { t } = useTranslation('common');
  React.useEffect(() => {
    if (footerPagination)
      setContent?.(<DataTablePagination table={table} context={context} className="px-10" />);
    return () => {
      setContent?.(null);
    };
  }, [footerPagination, context.totalPageCount, context.size, context.page]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    Object.fromEntries(context?.invisibleColumns?.map((column) => [column, false]) || [])
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters
    },
    meta: {
      context
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageSize: 100
      }
    },
    defaultColumn: {
      size: 0,
      minSize: 0
    }
  });
  return (
    <div className={cn(className, 'space-y-4')}>
      <DataTableToolbar table={table} context={context} />
      {Object.keys(rowSelection).length > 0 && (
        <div className="bg-primary/5 border border-primary/20 text-primary px-4 py-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              {t('datatable.elements_selected', { count: Object.keys(rowSelection).length })}
            </span>
            <button
              className="font-bold underline text-primary hover:text-primary/80 transition-colors"
              onClick={() => table.toggleAllRowsSelected(true)}>
              {t('datatable.select_all_search')}
            </button>
          </div>
          <button
            onClick={() => setRowSelection({})}
            className="hover:bg-primary/10 p-1.5 rounded-full transition-colors text-primary">
            <Cross2Icon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className={cn('rounded-lg border', containerClassName)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="text-sm font-semibold py-3.5 px-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50"
                    >
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
            {table.getRowModel().rows?.length && !isPending ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3.5 px-4 text-sm"
                      style={{ width: `${cell.column.getSize()}px` }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !isPending ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 font-bold">
                    {t('datatable.noResults')} <PackageOpen />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center ">
                  <div className="flex items-center justify-center gap-2 font-bold">
                    {t('table.loading')} <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!footerPagination && <DataTablePagination table={table} context={context} />}
    </div>
  );
}

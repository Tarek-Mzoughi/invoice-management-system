import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { DataTableConfig } from './types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  className?: string;
  table: Table<TData>;
  context: DataTableConfig<TData>;
}

export function DataTablePagination<TData>({
  context,
  className
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation('common');
  const size = context.size;
  const setPage = context.setPage;
  const setSize = context.setSize;
  const page = context.page;
  const totalPageCount = context.totalPageCount;

  return (
    <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between py-4', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('pagination.rows_per')}
        </span>
        <Select
          value={String(size)}
          onValueChange={(value) => {
            setPage(1);
            setSize(Number(value));
          }}
        >
          <SelectTrigger className="h-10 w-[72px] rounded-sm border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50, 100].map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t('pagination.enumerate', { page, totalPageCount })}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-sm"
          disabled={page <= 1 || totalPageCount === 0}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-sm"
          disabled={page >= totalPageCount || totalPageCount === 0}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

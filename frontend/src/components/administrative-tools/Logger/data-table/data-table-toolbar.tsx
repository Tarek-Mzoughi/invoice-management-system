import { Button } from '@/components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { DataTableViewOptions } from './data-table-view-options';
import { cn } from '@/lib/utils';
import { useLoggerActions } from './ActionsContext';
import { DatePicker } from '@/components/ui/date-picker';
import { DataTableEventFilter } from './data-table-event-filter';

interface DataTableToolbarProps<TData> {
  className?: string;
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ className, table }: DataTableToolbarProps<TData>) {
  const { t: tCommon } = useTranslation('common');

  const { startDate, endDate, setStartDate, setEndDate, events, setEvents } = useLoggerActions();
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <div className="flex flex-1 items-center justify-start space-x-2">
        <div className="flex flex-row gap-4 border-r pr-5">
          <div className="flex flex-row gap-2 items-center">
            <DatePicker
              className="w-40"
              value={startDate}
              onChange={(date: Date) => setStartDate?.(date)}
              placeholder={tCommon('start_date')}
            />
          </div>
          <div className="flex flex-row gap-2 items-center">
            <DatePicker
              className="w-40"
              value={endDate}
              onChange={(date: Date) => setEndDate?.(date)}
              placeholder={tCommon('end_date')}
            />
          </div>
        </div>
        <DataTableEventFilter className="mx-2" />

        {(startDate || endDate || events!.length > 0) && (
          <Button
            variant="ghost"
            onClick={() => {
              setStartDate?.(undefined);
              setEndDate?.(undefined);
              setEvents?.([]);
            }}
            className="h-8 px-2 lg:px-3 w-fit">
            {tCommon('commands.reset')}
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center justify-between gap-5">
        {table.getColumn('event') && <div className="flex flex-row gap-2 items-center"></div>}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

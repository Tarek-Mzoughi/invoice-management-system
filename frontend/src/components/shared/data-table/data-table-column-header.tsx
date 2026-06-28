import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { CaretSortIcon, EyeNoneIcon } from '@radix-ui/react-icons';
import { useTranslation } from 'react-i18next';
import { DataTableConfig } from './types';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  attribute?: string;
  context: DataTableConfig<TData>;
}
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  attribute,
  className,
  context
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useTranslation('common');

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-center data-[state=open]:bg-accent -ml-3">
            <span className="text-xs">{title}</span>
            {context.order === true && attribute == context.sortKey ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : context.order === false && attribute == context.sortKey ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <CaretSortIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => {
              if (attribute) context?.setSortDetails?.(false, attribute);
            }}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {t('datatable.order.asc')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (attribute) context?.setSortDetails?.(true, attribute);
            }}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {t('datatable.order.desc')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="font-bold" onClick={() => column.toggleVisibility(false)}>
            <EyeNoneIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {t('commands.hide')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

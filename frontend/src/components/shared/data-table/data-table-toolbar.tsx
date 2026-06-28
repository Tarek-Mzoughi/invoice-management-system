import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';
import { DataTableConfig } from './types';
import { useTranslation } from 'react-i18next';
import { DataTableViewOptions } from './data-table-view-options';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  context: DataTableConfig<TData>;
}

export function DataTableToolbar<TData>({ table, context }: DataTableToolbarProps<TData>) {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={t('datatable.search', { entity: context.pluralName })}
          value={context?.searchTerm?.toString()}
          onChange={(event) => {
            context.setPage(1);
            context?.setSearchTerm?.(event.target.value);
          }}
          className="h-8"
        />
        {context.searchTerm && (
          <Button variant="ghost" onClick={() => context?.setSearchTerm?.('')}>
            {t('commands.reset')}
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {context.showViewOptions !== false && <DataTableViewOptions table={table} />}
      {context.bulkActions && context.bulkActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 flex gap-2">
              {t('commands.actions')}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {context.bulkActions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                disabled={action.isActionVisible && !action.isActionVisible(table.getFilteredSelectedRowModel().rows.map((r) => r.original))}
                onClick={() =>
                  action.actionCallback(table.getFilteredSelectedRowModel().rows.map((r) => r.original))
                }
                className={cn('flex items-center gap-2', action.actionLabel.includes('Supprimer') && 'text-red-600 focus:text-red-600')}
              >
                {action.actionIcon}
                {action.actionLabel}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {context.createCallback && (
        <Button
          size={context.singularName ? 'default' : 'icon'}
          variant={context.singularName ? 'default' : 'outline'}
          className={cn('h-8', context.singularName && 'bg-blue-600 hover:bg-blue-700 text-white')}
          onClick={() => context.createCallback?.()}>
          <Plus className="h-4 w-4 mr-2" />
          {context.singularName && `${t('commands.create')} ${t('words.or')} ${context.singularName}`}
        </Button>
      )}
    </div>
  );
}

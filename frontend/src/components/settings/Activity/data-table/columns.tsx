import { Activity } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { DataTableConfig } from '@/components/shared/data-table/types';

export const getActivityColumns = (t: Function): ColumnDef<Activity>[] => {
  return [
    {
      accessorKey: 'id',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={t('activity.attributes.id')}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <div className="w-[80px]">{row.getValue('id')}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'label',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={t('activity.attributes.label')}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">{row.getValue('label')}</span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row, table }) => {
        const context = (table.options.meta as any)?.context as DataTableConfig<Activity>;
        return (
          <div className="flex justify-end">
            <DataTableRowActions row={row} context={context} />
          </div>
        );
      }
    }
  ];
};

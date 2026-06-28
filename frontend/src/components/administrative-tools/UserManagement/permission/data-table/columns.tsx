import { Permission } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { getPermissionTranslation } from '../utils/getPermissionTranslation';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';

export const getPermissionColumns = (
  t: Function,
  tPermission: Function
): ColumnDef<Permission>[] => {
  const translationNamespace = 'settings';
  const translate = (value: string, namespace: string = '') => {
    return t(value, { ns: namespace || translationNamespace });
  };

  return [
    {
      accessorKey: 'label',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('permissions.attributes.label')}
          attribute="label"
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => {
        return <div>{tPermission(`${getPermissionTranslation(row?.original?.label)}.value`)}</div>;
      },
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'description',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('permissions.attributes.description')}
          attribute="description"
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => (
        <div>
          {tPermission(`${getPermissionTranslation(row?.original?.label)}.description`) ||
            t('permissions.attributes.no_description')}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    }
  ];
};

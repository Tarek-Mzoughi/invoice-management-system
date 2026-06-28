import { Log } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from './data-table-column-header';
import { transformDateTime } from '@/utils/date.utils';
import { useLogTranslator } from '@/components/administrative-tools/Logger/hooks/useLogTranslator';
import { LOGGER_FILTER_ATTRIBUTES } from '@/constants/logger.filter-attributes';

export const getLogColumns = (tCommon: Function): ColumnDef<Log>[] => {
  const translationNamespace = 'logger';
  const translate = (value: string, namespace: string = '') => {
    return tCommon(value, { ns: namespace || translationNamespace });
  };

  return [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('common.attributes.id')}
          attribute={LOGGER_FILTER_ATTRIBUTES.ID}
        />
      ),
      cell: ({ row }) => <div>#{row.original?.id}</div>,
      enableSorting: false,
      enableHiding: true,
      size: 10
    },
    {
      accessorKey: 'context',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('common.attributes.context')}
          attribute={LOGGER_FILTER_ATTRIBUTES.EVENT_TYPE}
        />
      ),
      cell: ({ row }) => {
        return <div>{translate(`event_names.${row.original?.event}`)}</div>;
      },
      enableSorting: true,
      enableHiding: true,
      size: 10
    },
    {
      accessorKey: 'event',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('common.attributes.event')}
          attribute={LOGGER_FILTER_ATTRIBUTES.EVENT_TYPE}
        />
      ),
      cell: ({ row }) => {
        const CellComponent = () => {
          const translation = useLogTranslator(row.original);
          return <div>{translation}</div>;
        };
        return <CellComponent />;
      },
      enableSorting: true,
      enableHiding: true,
      size: 70
    },

    {
      accessorKey: 'logged_at',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('common.attributes.logged_at')}
          attribute={LOGGER_FILTER_ATTRIBUTES.LOGGEDAT}
        />
      ),
      cell: ({ row }) => (
        <div>{row.original?.loggedAt && transformDateTime(row.original?.loggedAt)}</div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 10
    }
  ];
};

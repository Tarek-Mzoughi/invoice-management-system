import { Interlocutor } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { transformDateTime } from '@/utils/date.utils';
import { INTERLOCUTOR_FILTER_ATTRIBUTES } from '@/constants/interlocutor.filter-attributes';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';

export const getInterlocutorColumns = (
  t: Function,
  tCommon: Function,
  context?: { firmId: number }
): ColumnDef<Interlocutor>[] => {
  const translationNamespace = 'contacts';
  const translate = (value: string, namespace: string = '') =>
    t(value, { ns: namespace || translationNamespace });

  const columns: ColumnDef<Interlocutor>[] = [
    {
      accessorKey: 'title',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.title')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.TITLE}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <div>{row.original.title}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'name',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.name')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.NAME}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <div>{row.original.name}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'surname',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.surname')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.SURNAME}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <div>{row.original.surname}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'phone',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.phone')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.PHONE}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original?.phone ? (
            row.original?.phone
          ) : (
            <span className="text-zinc-400">{translate('interlocutor.empty_cells.phone')}</span>
          )}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'email',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.email')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.EMAIL}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => (
        <div className="font-bold cursor-pointer hover:underline">{row.original.email}</div>
      ),
      enableSorting: true,
      enableHiding: true
    }
  ];

  // Conditionally add the "firms" column if `context?.firmId` is undefined
  if (!context?.firmId) {
    columns.push({
      accessorKey: 'firms',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.firms')}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => {
        const firms = row.original.firmsToInterlocutor || [];
        if (firms.length === 0) {
          return <div className="opacity-70">{translate('interlocutor.empty_cells.firms')}</div>;
        }

        const visibleFirms = firms.slice(0, 3); // Show up to 3 firms
        const hiddenFirms = firms.length - visibleFirms.length;

        return (
          <div>
            <div className="line-clamp-1">
              {visibleFirms.map((entry, index) => (
                <span key={index} className="mr-1">
                  {entry.firm?.name}
                  {index < visibleFirms.length - 1 && ', '}
                </span>
              ))}
              {hiddenFirms > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="font-extralight cursor-pointer mx-1">
                      {`+${hiddenFirms} more`}
                    </TooltipTrigger>
                    <TooltipContent>
                      {firms.slice(3).map((entry, index) => (
                        <p key={index}>{entry.firm?.name}</p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true
    });
  }

  // Conditionally add "position" and "is_main" columns if `context?.firmId` is provided
  if (context?.firmId) {
    columns.push(
      {
        accessorKey: 'position',
        header: ({ column, table }) => (
          <DataTableColumnHeader
            column={column}
            title={translate('interlocutor.attributes.position')}
            context={(table.options.meta as any)?.context}
          />
        ),
        cell: ({ row }) => {
          const position = row.original.firmsToInterlocutor?.find(
            (firm) => firm.firmId === context.firmId
          )?.position;

          return (
            <div>
              {position ? (
                position
              ) : (
                <span className="text-zinc-400">
                  {translate('interlocutor.empty_cells.position')}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: true
      },
      {
        accessorKey: 'is_main',
        header: ({ column, table }) => (
          <DataTableColumnHeader
            column={column}
            title={translate('interlocutor.attributes.is_main')}
            context={(table.options.meta as any)?.context}
          />
        ),
        cell: ({ row }) => (
          <div>
            <Badge className="px-4 py-1">
              {row.original.firmsToInterlocutor?.find((firm) => firm.firmId === context.firmId)
                ?.isMain
                ? tCommon('answer.yes')
                : tCommon('answer.no')}
            </Badge>
          </div>
        ),
        enableSorting: false,
        enableHiding: true
      }
    );
  }

  columns.push({
    accessorKey: 'created_at',
    header: ({ column, table }) => (
      <DataTableColumnHeader
        column={column}
        title={translate('interlocutor.attributes.created_at')}
        attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.CREATEDAT}
        context={(table.options.meta as any)?.context}
      />
    ),
    cell: ({ row }) => <div>{transformDateTime(row.original?.createdAt || '')}</div>,
    enableSorting: true,
    enableHiding: true
  });

  columns.push({
    id: 'actions',
    cell: ({ row, table }) => (
      <div className="flex justify-end">
        <DataTableRowActions row={row} context={(table.options.meta as any)?.context} />
      </div>
    )
  });

  return columns;
};

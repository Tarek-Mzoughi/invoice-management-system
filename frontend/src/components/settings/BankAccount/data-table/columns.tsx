import { BANK_ACCOUNT_TYPE, BankAccount } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { X } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { BANK_ACCOUNT_FILTER_ATTRIBUTES } from '@/constants/bank-account.filter-attributes';

export const getBankAccountColumns = (
  t: Function,
  tCurrency: Function
): ColumnDef<BankAccount>[] => {
  const translationNamespace = 'settings';
  const translate = (value: string, namespace: string = '') => {
    return t(value, { ns: namespace || translationNamespace });
  };

  return [
    {
      accessorKey: 'name',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('bank_account.attributes.name')}
          attribute={BANK_ACCOUNT_FILTER_ATTRIBUTES.NAME}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <div>{row.original.name}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'type',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('bank_account.attributes.type')}
          attribute={BANK_ACCOUNT_FILTER_ATTRIBUTES.TYPE}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.type === BANK_ACCOUNT_TYPE.CASH
            ? translate('bank_account.attributes.type_cash')
            : translate('bank_account.attributes.type_bank')}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'agency',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('bank_account.attributes.agency')}
          attribute={BANK_ACCOUNT_FILTER_ATTRIBUTES.AGENCY}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <div>{row.original.agency}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'iban',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('bank_account.attributes.iban')}
          attribute={BANK_ACCOUNT_FILTER_ATTRIBUTES.IBAN}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <div>{row.original.iban}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'currency',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('bank_account.attributes.currency')}
          attribute={BANK_ACCOUNT_FILTER_ATTRIBUTES.CURRENCY}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) =>
        row.original.currency ? (
          <div>
            {tCurrency(row.original.currency?.code)} ({row.original.currency?.symbol})
          </div>
        ) : (
          <div className="flex items-center gap-2 font-bold">
            <X className="h-5 w-5" /> <span>No Currency</span>
          </div>
        ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'isMain',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('bank_account.attributes.isMain')}
          attribute={BANK_ACCOUNT_FILTER_ATTRIBUTES.ISMAIN}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => (
        <div>
          {
            <Badge className="px-5">
              {row.original.isMain
                ? translate('answer.yes', 'common')
                : translate('answer.no', 'common')}
            </Badge>
          }
        </div>
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      id: 'actions',
      cell: ({ row, table }) => (
        <div className="flex justify-end">
          <DataTableRowActions row={row} context={(table.options.meta as any)?.context} />
        </div>
      )
    }
  ];
};

import { Tax } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { TAX_FILTER_ATTRIBUTES } from '@/constants/tax.filter-attributes';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { Label } from '@/components/ui/label';
import { DataTableConfig } from '@/components/shared/data-table/types';

export const getTaxColumns = (
  t: Function,
  tCommon: Function,
  tCurrency: Function,
  context: DataTableConfig<Tax>
): ColumnDef<Tax>[] => {

  return [
    {
      accessorKey: 'label',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('tax.attributes.label')}
          attribute={TAX_FILTER_ATTRIBUTES.LABEL}
        />
      ),
      cell: ({ row }) => <Label>{row.original.label}</Label>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('tax.attributes.type')}
          attribute={TAX_FILTER_ATTRIBUTES.ISRATE}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.isRate ? t('tax.types.rate') : t('tax.types.fixed')}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'value',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('tax.attributes.value')}
          attribute={TAX_FILTER_ATTRIBUTES.VALUE}
        />
      ),
      cell: ({ row }) => (
        <Label className="flex gap-1">
          <span>{row.original.value?.toFixed(2)}</span>
          <span>{row.original.isRate ? '%' : row.original.currency?.symbol || ''}</span>
        </Label>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'is_special',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('tax.attributes.is_special')}
          attribute={TAX_FILTER_ATTRIBUTES.ISSPECIAL}
        />
      ),
      cell: ({ row }) => (
        <div>
          <Badge>{row.original.isSpecial ? tCommon('answer.yes') : tCommon('answer.no')}</Badge>
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'currency',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('bank_account.attributes.currency')}
          attribute={TAX_FILTER_ATTRIBUTES.CURRENCY}
        />
      ),
      cell: ({ row }) =>
        row.original.currency ? (
          <div className="font-bold">{tCurrency(row.original.currency?.code || '')}</div>
        ) : (
          <div className="flex items-center gap-2 font-thin">
            {t('tax.attributes.applicable_on_all')}
          </div>
        ),
      enableSorting: true,
      enableHiding: true
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DataTableRowActions row={row} context={context} />
        </div>
      )
    }
  ];
};

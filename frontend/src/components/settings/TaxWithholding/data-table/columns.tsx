import { TaxWithholding } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { TAX_WITHHOLDING_FILTER_ATTRIBUTES } from '@/constants/tax-withholding-attributes';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { Label } from '@/components/ui/label';

export const getTaxWithholdingColumns = (t: Function): ColumnDef<TaxWithholding>[] => {
  return [
    {
      accessorKey: 'label',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={t('withholding.attributes.label')}
          attribute={TAX_WITHHOLDING_FILTER_ATTRIBUTES.LABEL}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <Label>{row.original.label}</Label>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'rate',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={t('withholding.attributes.rate')}
          attribute={TAX_WITHHOLDING_FILTER_ATTRIBUTES.RATE}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => (
        <Label className="flex gap-1">
          <span>{row.original.rate?.toFixed(2)}</span>
          <span>%</span>
        </Label>
      ),
      enableSorting: true,
      enableHiding: true
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

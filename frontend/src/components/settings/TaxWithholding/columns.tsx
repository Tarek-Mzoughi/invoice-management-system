import { TaxWithholding } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { TAX_WITHHOLDING_FILTER_ATTRIBUTES } from '@/constants/tax-withholding-attributes';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { Label } from '@/components/ui/label';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { useTranslation } from 'react-i18next';

export const useTaxWithholdingColumns = (
  context: DataTableConfig<TaxWithholding>
): ColumnDef<TaxWithholding>[] => {
  const { t } = useTranslation('settings');

  return [
    {
      accessorKey: 'label',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('withholding.attributes.label')}
          attribute={TAX_WITHHOLDING_FILTER_ATTRIBUTES.LABEL}
        />
      ),
      cell: ({ row }) => <Label>{row.original.label}</Label>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'rate',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('withholding.attributes.rate')}
          attribute={TAX_WITHHOLDING_FILTER_ATTRIBUTES.RATE}
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
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DataTableRowActions row={row} context={context} />
        </div>
      )
    }
  ];
};

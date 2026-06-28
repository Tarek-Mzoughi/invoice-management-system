import { PaymentCondition } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { PAYMENT_CONDITION_FILTER_ATTRIBUTES } from '@/constants/payment-condition.filter-attributes';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { Label } from '@/components/ui/label';

export const getPaymentConditionColumns = (t: Function): ColumnDef<PaymentCondition>[] => {
  return [
    {
      accessorKey: 'label',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={t('payment_condition.attributes.label')}
          attribute={PAYMENT_CONDITION_FILTER_ATTRIBUTES.LABEL}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <Label>{row.original.label}</Label>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'description',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          title={t('payment_condition.attributes.description')}
          attribute={PAYMENT_CONDITION_FILTER_ATTRIBUTES.DESCRIPTION}
          context={(table.options.meta as any)?.context}
        />
      ),
      cell: ({ row }) => <Label>{row.original.description}</Label>,
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

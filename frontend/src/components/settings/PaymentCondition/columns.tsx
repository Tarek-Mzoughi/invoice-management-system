import { PaymentCondition } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { PAYMENT_CONDITION_FILTER_ATTRIBUTES } from '@/constants/payment-condition.filter-attributes';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { Label } from '@/components/ui/label';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { useTranslation } from 'react-i18next';

export const usePaymentConditionColumns = (context: DataTableConfig<PaymentCondition>): ColumnDef<PaymentCondition>[] => {
  const { t } = useTranslation('settings');

  return [
    {
      accessorKey: 'label',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('payment_condition.attributes.label')}
          attribute={PAYMENT_CONDITION_FILTER_ATTRIBUTES.LABEL}
        />
      ),
      cell: ({ row }) => <Label>{row.original.label}</Label>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('payment_condition.attributes.description')}
          attribute={PAYMENT_CONDITION_FILTER_ATTRIBUTES.DESCRIPTION}
        />
      ),
      cell: ({ row }) => <Label>{row.original.description}</Label>,
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

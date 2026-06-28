import { CreditNote } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { transformDate, transformDateTime } from '@/utils/date.utils';
import { NextRouter, useRouter } from 'next/router';
import { CREDIT_NOTE_FILTER_ATTRIBUTES } from '@/constants/credit-note.filter-attributes';
import { useTranslation } from 'react-i18next';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { DataTableConfig } from '@/components/shared/data-table/types';

export const useCreditNoteColumns = (
  context: DataTableConfig<CreditNote>,
  firmId?: number,
  interlocutorId?: number
): ColumnDef<CreditNote>[] => {
  const router = useRouter();
  const { t } = useTranslation('invoicing');

  const firmColumn: ColumnDef<CreditNote> = {
    accessorKey: 'firm',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        context={context}
        title={t('quotation.attributes.firm')}
        attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.FIRM}
      />
    ),
    cell: ({ row }) => (
      <div
        className="font-bold cursor-pointer hover:underline"
        onClick={() => router.push(`/contacts/firm/${row.original?.firmId}`)}
      >
        {row.original.firm?.name}
      </div>
    ),
    enableSorting: true,
    enableHiding: true
  };

  const interlocutorColumn: ColumnDef<CreditNote> = {
    accessorKey: 'interlocutor',
    header: ({ column }) => (
      <DataTableColumnHeader
        context={context}
        column={column}
        title={t('quotation.attributes.interlocutor')}
        attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.INTERLOCUTOR}
      />
    ),
    cell: ({ row }) => (
      <div
        className="font-bold cursor-pointer hover:underline"
        onClick={() => router.push(`/contacts/interlocutor/${row.original?.interlocutorId}`)}
      >
        {row.original?.interlocutor?.surname} {row.original?.interlocutor?.name}
      </div>
    ),
    enableSorting: true,
    enableHiding: true
  };

  const columns: ColumnDef<CreditNote>[] = [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <DataTableColumnHeader
          context={context}
          column={column}
          title={t('creditNote.attributes.number')}
          attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.SEQUENTIAL}
        />
      ),
      cell: ({ row }) => <div>{row.original.sequential}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <DataTableColumnHeader
          context={context}
          column={column}
          title={t('creditNote.attributes.date')}
          attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.DATE}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.date ? (
            transformDate(row.original.date)
          ) : (
            <span>{t('creditNote.attributes.no_date')}</span>
          )}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'due_date',
      header: ({ column }) => (
        <DataTableColumnHeader
          context={context}
          column={column}
          title={t('creditNote.attributes.due_date')}
          attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.DUEDATE}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.dueDate ? (
            transformDate(row.original.dueDate)
          ) : (
            <span>{t('creditNote.attributes.no_due_date')}</span>
          )}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader
          context={context}
          column={column}
          title={t('creditNote.attributes.status')}
          attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.STATUS}
        />
      ),
      cell: ({ row }) => (
        <div>
          <Badge className="px-4 py-1">{t(row.original?.status || '')}</Badge>
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'total',
      header: ({ column }) => (
        <DataTableColumnHeader
          context={context}
          column={column}
          title={t('creditNote.attributes.total')}
          attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.TOTAL}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original?.total?.toFixed(row.original?.currency?.digitAfterComma)}{' '}
          {row.original?.currency?.symbol}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'amount_paid',
      header: ({ column }) => (
        <DataTableColumnHeader
          context={context}
          column={column}
          title={t('creditNote.attributes.amount_paid')}
          attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.AMOUNT_PAID}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original?.amountPaid?.toFixed(row.original?.currency?.digitAfterComma)}{' '}
          {row.original?.currency?.symbol}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'withholding',
      header: ({ column }) => (
        <DataTableColumnHeader
          context={context}
          column={column}
          title={t('creditNote.attributes.withholding')}
          attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.TAX_WITHHOLDING}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original?.taxWithholdingAmount?.toFixed(row.original?.currency?.digitAfterComma)}{' '}
          {row.original?.currency?.symbol}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader
          context={context}
          column={column}
          title={t('creditNote.attributes.created_at')}
          attribute={CREDIT_NOTE_FILTER_ATTRIBUTES.CREATEDAT}
        />
      ),
      cell: ({ row }) => <div>{transformDateTime(row.original?.createdAt || '')}</div>,
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
  if (!firmId) columns.splice(2, 0, firmColumn);
  if (!interlocutorId) columns.splice(3, 0, interlocutorColumn);
  return columns;
};

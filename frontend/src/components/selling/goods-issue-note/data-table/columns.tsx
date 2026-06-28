import { GoodsIssueNote } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { DataTableColumnHeader } from './data-table-column-header';
import { transformDate, transformDateTime } from '@/utils/date.utils';
import { NextRouter } from 'next/router';
import { GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES } from '@/constants/goods-issue-note.filter-attributes';
import { firm } from '@/api';

export const getGoodsIssueNoteColumns = (
  t: Function,
  router: NextRouter,
  firmId?: number,
  interlocutorId?: number
): ColumnDef<GoodsIssueNote>[] => {
  const translationNamespace = 'invoicing';
  const translate = (value: string, namespace: string = '') => {
    return t(value, { ns: namespace || translationNamespace });
  };
  const firmColumn: ColumnDef<GoodsIssueNote> = {
    accessorKey: 'firm',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={translate('goodsIssueNote.attributes.firm')}
        attribute={GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES.FIRM}
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

  const interlocutorColumn: ColumnDef<GoodsIssueNote> = {
    accessorKey: 'interlocutor',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={translate('goodsIssueNote.attributes.interlocutor')}
        attribute={GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES.INTERLOCUTOR}
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

  const columns: ColumnDef<GoodsIssueNote>[] = [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('goodsIssueNote.attributes.number')}
          attribute={GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES.SEQUENTIAL}
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
          column={column}
          title={translate('goodsIssueNote.attributes.date')}
          attribute={GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES.DATE}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.date ? (
            transformDate(row.original.date)
          ) : (
            <span>{t('goodsIssueNote.attributes.no_date')}</span>
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
          column={column}
          title={translate('goodsIssueNote.attributes.due_date')}
          attribute={GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES.DUEDATE}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.dueDate ? (
            transformDate(row.original.dueDate)
          ) : (
            <span>{t('goodsIssueNote.attributes.no_due_date')}</span>
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
          column={column}
          title={translate('goodsIssueNote.attributes.status')}
          attribute={GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES.STATUS}
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
          column={column}
          title={translate('goodsIssueNote.attributes.total')}
          attribute={GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES.TOTAL}
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
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('goodsIssueNote.attributes.created_at')}
          attribute={GOODS_ISSUE_NOTE_FILTER_ATTRIBUTES.CREATEDAT}
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
          <DataTableRowActions row={row} />
        </div>
      )
    }
  ];
  if (!firmId) columns.splice(2, 0, firmColumn);
  if (!interlocutorId) columns.splice(3, 0, interlocutorColumn);
  return columns;
};

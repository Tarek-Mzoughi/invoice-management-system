import { ColumnDef } from '@tanstack/react-table';
import { Landmark, Wallet } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/data-table/data-table-row-actions';
import { Badge } from '@/components/ui/badge';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { BANK_ACCOUNT_TYPE, BankAccount } from '@/types';
import { BANK_ACCOUNT_FILTER_ATTRIBUTES } from '@/constants/bank-account.filter-attributes';
import { useTranslation } from 'react-i18next';

const formatBalance = (account: BankAccount, locale: string) => {
  const digits = account.currency?.digitAfterComma ?? 3;
  const amount = account.balance ?? 0;

  return `${amount.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })} ${account.currency?.symbol || ''}`.trim();
};

export const useBankAccountColumns = (
  context: DataTableConfig<BankAccount>
): ColumnDef<BankAccount>[] => {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('bank_account.attributes.name')}
          attribute={BANK_ACCOUNT_FILTER_ATTRIBUTES.NAME}
        />
      ),
      cell: ({ row }) => {
        const isCashAccount = row.original.type === BANK_ACCOUNT_TYPE.CASH;

        return (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              {isCashAccount ? <Wallet className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900">{row.original.name}</span>
              {row.original.isMain && (
                <span className="text-xs text-zinc-500">{tCommon('words.main_m')}</span>
              )}
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          context={context}
          title={t('bank_account.attributes.type')}
          attribute={BANK_ACCOUNT_FILTER_ATTRIBUTES.TYPE}
        />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-md px-3 py-1 font-normal">
          {row.original.type === BANK_ACCOUNT_TYPE.CASH
            ? t('bank_account.attributes.type_cash')
            : t('bank_account.attributes.type_bank')}
        </Badge>
      ),
      enableSorting: true,
      enableHiding: false
    },
    {
      accessorKey: 'balance',
      header: () => <div className="text-xs font-medium">{t('bank_account.attributes.balance')}</div>,
      cell: ({ row }) => {
        const balance = row.original.balance ?? 0;

        return (
          <div
            className={
              balance >= 0 ? 'text-sm font-semibold text-emerald-600' : 'text-sm font-semibold text-red-600'
            }>
            {formatBalance(row.original, i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false
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

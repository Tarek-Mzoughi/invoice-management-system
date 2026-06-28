import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Edit,
  Landmark,
  MoreHorizontal,
  Play,
  Plus,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useDebounce } from '@/hooks/other/useDebounce';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/utils/errors';
import {
  BANK_ACCOUNT_TYPE,
  BankAccount,
  CreateBankAccountDto,
  CreateTreasuryMovementDto,
  UpdateBankAccountDto
} from '@/types';
import { BankAccountDeleteDialog } from './dialogs/BankAccountDeleteDialog';
import { BankAccountCreateDialog } from './dialogs/BankAccountCreateDialog';
import { BankAccountPromoteDialog } from './dialogs/BankAccountPromoteDialog';
import { TreasuryExpenseSheet } from './dialogs/TreasuryExpenseSheet';
import { TreasuryDepositSheet } from './dialogs/TreasuryDepositSheet';
import { BankAccountUpdateDialog } from './dialogs/BankAccountUpdateDialog';
import { TreasuryTransferSheet } from './dialogs/TreasuryTransferSheet';
import { useBankAccountManager } from './hooks/useBankAccountManager';

interface BankAccountPortalProps {
  className?: string;
}

interface TreasuryAccountRowActionsProps {
  account: BankAccount;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
  onPromote: (account: BankAccount) => void;
  onDeposit?: (account: BankAccount) => void;
  onTransfer?: (account: BankAccount) => void;
  onExpense?: (account: BankAccount) => void;
  onViewTransactions?: (account: BankAccount) => void;
}

const formatBalance = (account: BankAccount, locale: string) => {
  const digits = account.currency?.digitAfterComma ?? 3;
  const amount = account.balance ?? 0;

  return `${amount.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })} ${account.currency?.symbol || ''}`.trim();
};

import {
  Banknote,
  Repeat,
  Eye,
} from 'lucide-react';

// Let's ensure these are rendered properly.
const TreasuryAccountRowActions: React.FC<TreasuryAccountRowActionsProps> = ({
  account,
  onEdit,
  onDelete,
  onPromote,
  onDeposit,
  onTransfer,
  onExpense,
  onViewTransactions
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        className="h-8 w-8 rounded-md p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title={tSettings('bank_account.actions.view_transactions')}
        aria-label={tSettings('bank_account.actions.view_transactions')}
        onClick={() => onViewTransactions?.(account)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="h-8 w-8 rounded-md p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title={tSettings('bank_account.actions.add_expense')}
        aria-label={tSettings('bank_account.actions.add_expense')}
        onClick={() => onExpense?.(account)}
      >
        <DollarSign className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 rounded-md p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onDeposit?.(account)}>
            <ArrowUp className="h-4 w-4 text-emerald-600" />
            <span>{tSettings('bank_account.actions.deposit')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onTransfer?.(account)}>
            <Repeat className="h-4 w-4" />
            <span>{tSettings('bank_account.actions.transfer')}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onEdit(account)}>
            <Edit className="h-4 w-4" />
            <span>{tCommon('commands.edit')}</span>
          </DropdownMenuItem>

          {!account.isMain && (
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950 dark:focus:text-red-400"
              onClick={() => onDelete(account)}
            >
              <Trash2 className="h-4 w-4" />
              <span>{tCommon('commands.delete')}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const BankAccountPortal: React.FC<BankAccountPortalProps> = ({ className }) => {
  const router = useRouter();

  const { t: tCommon, i18n } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  const { setRoutes } = useBreadcrumb();

  React.useEffect(() => {
    setRoutes?.([{ title: tCommon('menu.treasury') }, { title: tCommon('submenu.accounts') }]);
  }, [router.locale, setRoutes, tCommon]);

  const bankAccountManager = useBankAccountManager();

  const [page, setPage] = React.useState(1);
  const { value: debouncedPage, loading: paging } = useDebounce<number>(page, 300);

  const [size, setSize] = React.useState(20);
  const { value: debouncedSize, loading: resizing } = useDebounce<number>(size, 300);

  const [createDialog, setCreateDialog] = React.useState(false);
  const [updateDialog, setUpdateDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [promoteDialog, setPromoteDialog] = React.useState(false);
  const [expenseDialog, setExpenseDialog] = React.useState(false);
  const [transferDialog, setTransferDialog] = React.useState(false);
  const [depositDialog, setDepositDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: bankAccountsResp,
    refetch: refetchBankAccounts
  } = useQuery({
    queryKey: ['bank-accounts', debouncedPage, debouncedSize],
    queryFn: () => api.bankAccount.findPaginated(debouncedPage, debouncedSize, 'ASC', 'id')
  });

  const {
    data: expenseAccountsResp,
    refetch: refetchExpenseAccounts,
    isPending: isExpenseAccountsPending
  } = useQuery({
    queryKey: ['bank-account-options', 'treasury'],
    queryFn: () => api.bankAccount.find()
  });

  const bankAccounts = React.useMemo(() => bankAccountsResp?.data || [], [bankAccountsResp]);
  const expenseAccounts = React.useMemo(() => expenseAccountsResp || [], [expenseAccountsResp]);

  const closeWithFocusRelease = React.useCallback((callback: () => void) => {
    if (typeof document !== 'undefined') {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const body = document.body;
      const previousTabIndex = body.getAttribute('tabindex');
      body.setAttribute('tabindex', '-1');
      body.focus({ preventScroll: true });

      window.requestAnimationFrame(() => {
        if (previousTabIndex === null) {
          body.removeAttribute('tabindex');
        } else {
          body.setAttribute('tabindex', previousTabIndex);
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(callback);
      return;
    }

    callback();
  }, []);

  const closeCreateDialog = React.useCallback(() => {
    closeWithFocusRelease(() => {
      setCreateDialog(false);
      bankAccountManager.reset();
    });
  }, [bankAccountManager, closeWithFocusRelease]);

  const closeUpdateDialog = React.useCallback(() => {
    closeWithFocusRelease(() => {
      setUpdateDialog(false);
      bankAccountManager.reset();
    });
  }, [bankAccountManager, closeWithFocusRelease]);

  const closeDeleteDialog = React.useCallback(() => {
    closeWithFocusRelease(() => {
      setDeleteDialog(false);
      bankAccountManager.reset();
    });
  }, [bankAccountManager, closeWithFocusRelease]);

  const closePromoteDialog = React.useCallback(() => {
    closeWithFocusRelease(() => {
      setPromoteDialog(false);
      bankAccountManager.reset();
    });
  }, [bankAccountManager, closeWithFocusRelease]);

  const closeExpenseDialog = React.useCallback(() => {
    closeWithFocusRelease(() => {
      setExpenseDialog(false);
    });
  }, [closeWithFocusRelease]);

  const closeTransferDialog = React.useCallback(() => {
    closeWithFocusRelease(() => {
      setTransferDialog(false);
    });
  }, [closeWithFocusRelease]);

  const closeDepositDialog = React.useCallback(() => {
    closeWithFocusRelease(() => {
      setDepositDialog(false);
    });
  }, [closeWithFocusRelease]);

  const totalAccounts = bankAccountsResp?.meta.itemCount ?? expenseAccounts.length;
  const totalPageCount = bankAccountsResp?.meta.pageCount ?? 1;
  const currentPage = bankAccountsResp?.meta.page ?? page;
  const currentPageSize = bankAccountsResp?.meta.take ?? size;
  const rangeStart = totalAccounts === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const rangeEnd = totalAccounts === 0 ? 0 : rangeStart + bankAccounts.length - 1;

  const hasToCreateMainByDefault = totalAccounts === 0;
  const hasToUpdateMainByDefault = totalAccounts === 1;

  const refetchTreasuryAccounts = React.useCallback(async () => {
    await Promise.all([refetchBankAccounts(), refetchExpenseAccounts()]);
  }, [refetchBankAccounts, refetchExpenseAccounts]);

  const { mutate: createBankAccount, isPending: isCreatePending } = useMutation({
    mutationFn: (data: CreateBankAccountDto) => api.bankAccount.create(data),
    onSuccess: async () => {
      toast.success(tSettings('bank_account.action_add_success'));
      await refetchTreasuryAccounts();
      closeCreateDialog();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('settings', mutationError, 'bank_account.action_add_failure'));
    }
  });

  const { mutate: updateBankAccount, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: UpdateBankAccountDto) => api.bankAccount.update(data),
    onSuccess: async () => {
      toast.success(tSettings('bank_account.action_edit_success'));
      await refetchTreasuryAccounts();
      closeUpdateDialog();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('settings', mutationError, 'bank_account.action_edit_failure'));
    }
  });

  const { mutate: removeBankAccount, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.bankAccount.remove(id),
    onSuccess: async () => {
      if (bankAccounts.length === 1 && page > 1) {
        setPage(page - 1);
      }
      toast.success(tSettings('bank_account.action_remove_success'));
      await refetchTreasuryAccounts();
      closeDeleteDialog();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('settings', mutationError, 'bank_account.action_remove_failure'));
    }
  });

  const { mutate: promoteBankAccount, isPending: isPromotionPending } = useMutation({
    mutationFn: (data: BankAccount) => api.bankAccount.update({ ...data, isMain: true }),
    onSuccess: async (data) => {
      toast.success(tSettings('bank_account.action_promote_success', { name: data.name }));
      await refetchTreasuryAccounts();
      closePromoteDialog();
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage('settings', mutationError, 'bank_account.action_promote_failure')
      );
    }
  });

  const { mutate: createExpense, isPending: isExpensePending } = useMutation({
    mutationFn: (data: CreateTreasuryMovementDto) => api.treasuryMovement.create(data),
    onSuccess: async () => {
      toast.success(tSettings('bank_account.expense.action_add_success'));
      await refetchTreasuryAccounts();
      closeExpenseDialog();
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage('settings', mutationError, 'bank_account.expense.action_add_failure')
      );
    }
  });

  const { mutate: createDeposit, isPending: isDepositPending } = useMutation({
    mutationFn: (data: CreateTreasuryMovementDto) => api.treasuryMovement.create(data),
    onSuccess: async () => {
      toast.success(tSettings('bank_account.deposit.action_add_success'));
      await refetchTreasuryAccounts();
      closeDepositDialog();
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage('settings', mutationError, 'bank_account.deposit.action_add_failure')
      );
    }
  });

  const { mutate: createTransfer, isPending: isTransferPending } = useMutation({
    mutationFn: async ({ source, dest }: { source: CreateTreasuryMovementDto; dest: CreateTreasuryMovementDto }) => {
      // Create both conceptually. If backend has .transfer, we would use it.
      await api.treasuryMovement.create(source);
      await api.treasuryMovement.create(dest);
    },
    onSuccess: async () => {
      toast.success(tSettings('bank_account.transfer.action_add_success'));
      await refetchTreasuryAccounts();
      closeTransferDialog();
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage('settings', mutationError, 'bank_account.transfer.action_add_failure')
      );
    }
  });

  const handleBankAccountCreateSubmit = () => {
    if (hasToCreateMainByDefault) {
      bankAccountManager.set('isMain', true);
    }

    const bankAccount = bankAccountManager.getBankAccount();
    const validation = api.bankAccount.validate(bankAccount, hasToCreateMainByDefault);

    if (validation.message) {
      toast.error(tSettings(validation.message));
      return;
    }

    createBankAccount(bankAccount);
  };

  const handleBankAccountUpdateSubmit = () => {
    const bankAccount = bankAccountManager.getBankAccount();
    const currentMainLocked = Boolean(
      bankAccount.id && bankAccounts.find((account) => account.id === bankAccount.id)?.isMain
    );
    const validation = api.bankAccount.validate(
      bankAccount,
      hasToUpdateMainByDefault,
      currentMainLocked
    );

    if (validation.message) {
      toast.error(tSettings(validation.message));
      return;
    }

    updateBankAccount(bankAccount);
  };

  const isPending =
    isFetchPending ||
    isCreatePending ||
    isUpdatePending ||
    isDeletePending ||
    isPromotionPending ||
    paging ||
    resizing;

  if (error instanceof Error) {
    return <div className="py-6 text-sm text-red-600">{error.message}</div>;
  }

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <div className="flex flex-col gap-6 pb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {tSettings('bank_account.title')}
            </h1>

          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-sm border-zinc-200 bg-white px-4 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => setCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              {tSettings('bank_account.add_button_label')}
            </Button>
            <Button
              type="button"
              className="h-10 gap-2 rounded-sm px-4"
              disabled={!expenseAccounts.length || isExpenseAccountsPending}
              onClick={() => setExpenseDialog(true)}
            >
              <DollarSign className="h-4 w-4" />
              {tSettings('bank_account.expense.add_button_label')}
            </Button>
          </div>
        </div>

        <BankAccountCreateDialog
          open={createDialog}
          isCreatePending={isCreatePending}
          createBankAccount={handleBankAccountCreateSubmit}
          onClose={closeCreateDialog}
          mainByDefault={hasToCreateMainByDefault}
        />

        <BankAccountUpdateDialog
          open={updateDialog}
          updateBankAccount={handleBankAccountUpdateSubmit}
          isUpdatePending={isUpdatePending}
          onClose={closeUpdateDialog}
          mainByDefault={hasToUpdateMainByDefault}
        />

        <BankAccountDeleteDialog
          open={deleteDialog}
          deleteBankAccount={() => {
            if (bankAccountManager.id) {
              removeBankAccount(bankAccountManager.id);
            }
          }}
          isDeletionPending={isDeletePending}
          label={bankAccountManager.name || ''}
          onClose={closeDeleteDialog}
        />

        <BankAccountPromoteDialog
          open={promoteDialog}
          promoteBankAccount={() => {
            if (bankAccountManager.id) {
              promoteBankAccount(bankAccountManager.getBankAccount());
            }
          }}
          isPromotingPending={isPromotionPending}
          label={bankAccountManager.name || ''}
          onClose={closePromoteDialog}
        />

        <TreasuryExpenseSheet
          open={expenseDialog}
          accounts={expenseAccounts}
          isPending={isExpensePending}
          createExpense={createExpense}
          onClose={closeExpenseDialog}
        />

        <TreasuryTransferSheet
          open={transferDialog}
          accounts={expenseAccounts}
          isPending={isTransferPending}
          defaultSourceAccountId={bankAccountManager.id}
          createTransfer={(source, dest) => createTransfer({ source, dest })}
          onClose={closeTransferDialog}
        />

        <TreasuryDepositSheet
          open={depositDialog}
          accounts={expenseAccounts}
          isPending={isDepositPending}
          defaultAccountId={bankAccountManager.id}
          createDeposit={createDeposit}
          onClose={closeDepositDialog}
        />

        <div className="overflow-hidden rounded-sm border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                    {tSettings('bank_account.attributes.name')}
                  </th>
                  <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                    {tSettings('bank_account.attributes.type')}
                  </th>
                  <th className="px-4 py-3 text-left text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                    {tSettings('bank_account.attributes.balance')}
                  </th>
                  <th className="px-4 py-3 text-right text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                    {tCommon('commands.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {isPending ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10">
                      <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                        <Spinner />
                        {tCommon('table.loading')}
                      </div>
                    </td>
                  </tr>
                ) : bankAccounts.length ? (
                  bankAccounts.map((account) => {
                    const isBankAccount = account.type === BANK_ACCOUNT_TYPE.BANK;
                    const balance = account.balance ?? 0;

                    return (
                      <tr key={account.id} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-700">
                        <td className="px-4 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-center gap-3">
                            {isBankAccount && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-orange-100 text-orange-600">
                                <Landmark className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <span className="font-medium">{account.name}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                          {isBankAccount
                            ? tSettings('bank_account.attributes.type_bank')
                            : tSettings('bank_account.attributes.type_cash')}
                        </td>

                        <td
                          className={cn(
                            'px-4 py-4 text-sm font-semibold',
                            balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                          )}
                        >
                          {formatBalance(account, i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <TreasuryAccountRowActions
                              account={account}
                              onViewTransactions={(targetAccount) => {
                                router.push(`/treasury/transactions?accountId=${targetAccount.id}`);
                              }}
                              onExpense={(targetAccount) => {
                                bankAccountManager.setBankAccount(targetAccount);
                                setExpenseDialog(true);
                              }}
                              onDeposit={(targetAccount) => {
                                bankAccountManager.setBankAccount(targetAccount);
                                setDepositDialog(true);
                              }}
                              onTransfer={(targetAccount) => {
                                bankAccountManager.setBankAccount(targetAccount);
                                setTransferDialog(true);
                              }}
                              onEdit={(targetAccount) => {
                                bankAccountManager.setBankAccount(targetAccount);
                                setUpdateDialog(true);
                              }}
                              onPromote={(targetAccount) => {
                                bankAccountManager.setBankAccount(targetAccount);
                                setPromoteDialog(true);
                              }}
                              onDelete={(targetAccount) => {
                                bankAccountManager.setBankAccount(targetAccount);
                                setDeleteDialog(true);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      {tCommon('datatable.noResults')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-zinc-200 px-4 py-4 text-sm dark:border-zinc-700 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="text-zinc-700 dark:text-zinc-300">{tSettings('bank_account.pagination.rows')}</span>
              <Select
                value={size.toString()}
                onValueChange={(value) => {
                  setPage(1);
                  setSize(Number(value));
                }}
              >
                <SelectTrigger className="h-9 w-[72px] rounded-sm border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 50, 100].map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 md:ml-10">
              {tSettings('bank_account.pagination.page', {
                page: currentPage,
                total: totalPageCount
              })}
            </span>

            <span className="text-sm text-zinc-500 dark:text-zinc-400 md:ml-8">
              {tSettings('bank_account.pagination.range', {
                start: rangeStart,
                end: rangeEnd,
                total: totalAccounts
              })}
            </span>

            <div className="flex items-center gap-2 md:ml-auto">
              <Button
                type="button"
                variant="outline"
                className="h-8 w-8 rounded-sm border-zinc-200 p-0 dark:border-zinc-700"
                onClick={() => setPage(page - 1)}
                disabled={!bankAccountsResp?.meta.hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-8 w-8 rounded-sm border-zinc-200 p-0 dark:border-zinc-700"
                onClick={() => setPage(page + 1)}
                disabled={!bankAccountsResp?.meta.hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

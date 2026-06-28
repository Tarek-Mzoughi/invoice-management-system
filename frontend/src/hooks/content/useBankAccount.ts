import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { BANK_ACCOUNT_TYPE } from '@/types';
import type { HookQueryOptions } from './queryOptions';

interface UseBankAccountOptions extends HookQueryOptions {
  type?: BANK_ACCOUNT_TYPE;
}

const useBankAccount = ({
  enabled = true,
  type = BANK_ACCOUNT_TYPE.BANK,
  silentForbiddenToast
}: UseBankAccountOptions = {}) => {
  const { isPending: isFetchBankAccountsPending, data: bankAccountsResp } = useQuery({
    queryKey: ['bank-accounts', type],
    queryFn: () => api.bankAccount.find(type, { silentForbiddenToast }),
    enabled
  });

  const bankAccounts = React.useMemo(() => {
    if (!enabled) return [];
    if (!bankAccountsResp) return [];
    return bankAccountsResp;
  }, [bankAccountsResp, enabled]);

  return {
    bankAccounts,
    isFetchBankAccountsPending: enabled ? isFetchBankAccountsPending : false
  };
};

export default useBankAccount;

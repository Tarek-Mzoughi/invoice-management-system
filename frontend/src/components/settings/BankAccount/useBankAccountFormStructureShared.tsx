import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldVariant,
  FormStructure,
  SelectFieldProps,
  SwitchFieldProps,
  TextFieldProps
} from '@/components/shared/form-builder/types';
import { BANK_ACCOUNT_TYPE } from '@/types';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useBankAccountManager } from './hooks/useBankAccountManager';

export const useBankAccountFormStructure = (_mainByDefault?: boolean) => {
  const { t: tCurrency } = useTranslation('currency');
  const { t: tSettings } = useTranslation('settings');

  const bankAccountManager = useBankAccountManager();
  const { currencies } = useCurrency();
  const mainByDefault = Boolean(_mainByDefault);
  const isCurrentMainAccount = Boolean(bankAccountManager.id && bankAccountManager.isMain);
  const isMainToggleLocked = mainByDefault || isCurrentMainAccount;

  const typeField: Field = {
    id: 'bank-account-type',
    label: tSettings('bank_account.attributes.type'),
    variant: FieldVariant.CUSTOM,
    required: true,
    props: {
      children: (
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-11 flex-1 justify-between rounded-md border px-4 text-sm font-medium transition-all',
              bankAccountManager.type === BANK_ACCOUNT_TYPE.CASH
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
            )}
            onClick={() => bankAccountManager.set('type', BANK_ACCOUNT_TYPE.CASH)}
          >
            <span>{tSettings('bank_account.attributes.type_cash')}</span>
            <CheckCircle2
              className={cn(
                'h-4 w-4',
                bankAccountManager.type === BANK_ACCOUNT_TYPE.CASH
                  ? 'text-primary'
                  : 'text-zinc-300 dark:text-zinc-600'
              )}
            />
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-11 flex-1 justify-between rounded-md border px-4 text-sm font-medium transition-all',
              bankAccountManager.type === BANK_ACCOUNT_TYPE.BANK
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
            )}
            onClick={() => bankAccountManager.set('type', BANK_ACCOUNT_TYPE.BANK)}
          >
            <span>{tSettings('bank_account.attributes.type_bank')}</span>
            <CheckCircle2
              className={cn(
                'h-4 w-4',
                bankAccountManager.type === BANK_ACCOUNT_TYPE.BANK
                  ? 'text-primary'
                  : 'text-zinc-300 dark:text-zinc-600'
              )}
            />
          </Button>
        </div>
      )
    }
  };

  const nameField: Field<TextFieldProps> = {
    id: 'bank-account-name',
    label: tSettings('bank_account.attributes.name'),
    required: true,
    variant: FieldVariant.TEXT,
    placeholder: tSettings('bank_account.placeholders.name'),
    description: tSettings('bank_account.hints.internal_name'),
    props: {
      value: bankAccountManager?.name ?? '',
      onChange: (e: string) => bankAccountManager.set('name', e)
    }
  };

  const agencyField: Field<TextFieldProps> = {
    id: 'bank-account-agency',
    label: tSettings('bank_account.attributes.agency'),
    required: bankAccountManager.type === BANK_ACCOUNT_TYPE.BANK,
    variant: FieldVariant.TEXT,
    hidden: bankAccountManager.type !== BANK_ACCOUNT_TYPE.BANK,
    placeholder: tSettings('bank_account.placeholders.agency'),
    props: {
      value: bankAccountManager?.agency ?? '',
      onChange: (e: string) => bankAccountManager.set('agency', e)
    }
  };

  const bicField: Field<TextFieldProps> = {
    id: 'bank-account-bic',
    label: tSettings('bank_account.attributes.bic'),
    required: bankAccountManager.type === BANK_ACCOUNT_TYPE.BANK,
    variant: FieldVariant.TEXT,
    hidden: bankAccountManager.type !== BANK_ACCOUNT_TYPE.BANK,
    placeholder: tSettings('bank_account.placeholders.bic'),
    props: {
      value: bankAccountManager?.bic ?? '',
      onChange: (e: string) => bankAccountManager.set('bic', e)
    }
  };

  const ribField: Field<TextFieldProps> = {
    id: 'bank-account-rib',
    label: tSettings('bank_account.attributes.rib'),
    required: bankAccountManager.type === BANK_ACCOUNT_TYPE.BANK,
    variant: FieldVariant.TEXT,
    hidden: bankAccountManager.type !== BANK_ACCOUNT_TYPE.BANK,
    placeholder: tSettings('bank_account.placeholders.rib'),
    props: {
      value: bankAccountManager?.rib ?? '',
      onChange: (e: string) => bankAccountManager.set('rib', e)
    }
  };

  const ibanField: Field<TextFieldProps> = {
    id: 'bank-account-iban',
    label: tSettings('bank_account.attributes.iban'),
    required: bankAccountManager.type === BANK_ACCOUNT_TYPE.BANK,
    variant: FieldVariant.TEXT,
    hidden: bankAccountManager.type !== BANK_ACCOUNT_TYPE.BANK,
    placeholder: tSettings('bank_account.placeholders.iban'),
    props: {
      value: bankAccountManager?.iban ?? '',
      onChange: (e: string) => bankAccountManager.set('iban', e)
    }
  };

  const currencyField: Field<SelectFieldProps> = {
    id: 'bank-account-currency',
    label: tSettings('bank_account.attributes.currency'),
    required: true,
    variant: FieldVariant.SELECT,
    placeholder: tSettings('bank_account.placeholders.currency'),
    props: {
      value: (bankAccountManager?.currencyId || bankAccountManager?.currency?.id)?.toString(),
      onValueChange: (e: string) => {
        const currencyId = parseInt(e, 10);
        const selectedCurrency = currencies.find((currency) => currency.id === currencyId);
        bankAccountManager.set('currencyId', currencyId);
        bankAccountManager.set('currency', selectedCurrency);
      },
      options: currencies?.map((currency) => ({
        label: [currency?.code, currency?.label ?? (currency?.code ? tCurrency(currency?.code) : '')]
          .filter(Boolean)
          .join(' - '),
        value: currency?.id?.toString() || ''
      }))
    }
  };

  const isMainField: Field<SwitchFieldProps> = {
    id: 'bank-account-is-main',
    label: tSettings('bank_account.attributes.isMain'),
    variant: FieldVariant.SWITCH,
    description: mainByDefault
      ? tSettings('bank_account.hints.first_account_main')
      : isCurrentMainAccount
        ? tSettings('bank_account.hints.main_locked')
        : tSettings('bank_account.hints.is_main'),
    props: {
      checked: mainByDefault || Boolean(bankAccountManager?.isMain),
      disabled: isMainToggleLocked,
      onCheckedChange: (e: boolean) => bankAccountManager.set('isMain', e)
    }
  };

  const bankAccountFormStructure: FormStructure = {
    title: tSettings('bank_account.singular'),
    orientation: 'vertical',
    layout: 'stacked',
    fieldsets: [
      {
        rows: [
          {
            fields: [typeField]
          },
          {
            fields: [nameField]
          },
          {
            fields: [bicField]
          },
          {
            fields: [ribField]
          },
          {
            fields: [ibanField]
          },
          {
            fields: [agencyField]
          },
          {
            fields: [currencyField]
          },
          {
            fields: [isMainField]
          }
        ]
      }
    ]
  };

  return { bankAccountFormStructure };
};

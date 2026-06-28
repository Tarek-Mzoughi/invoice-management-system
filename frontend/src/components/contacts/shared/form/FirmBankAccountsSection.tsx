import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Landmark
} from 'lucide-react';
import flags from 'react-phone-number-input/flags';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Currency, FirmBankAccount } from '@/types';
import { useFirmStore } from '@/hooks/stores/useFirmStore';
import { api } from '@/api';

interface FirmBankAccountsSectionProps {
  currencies?: Currency[];
  loading?: boolean;
}

const fieldClassName =
  'h-11 rounded-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950';
const labelClassName = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const sectionTitleClassName = 'text-xl font-semibold text-zinc-950 dark:text-zinc-50';

export const FirmBankAccountsSection = ({
  currencies = [],
  loading
}: FirmBankAccountsSectionProps) => {
  const firmStore = useFirmStore();
  const { t: tContact } = useTranslation('contacts');
  const { t: tCurrency } = useTranslation('currency');
  const [isOpen, setIsOpen] = React.useState(true);

  const bankAccounts = firmStore.bankAccounts || [];

  const uniqueCurrencies = React.useMemo(() => {
    const seen = new Set<string>();
    return currencies.filter((c) => {
      if (!c.code) return false;
      if (seen.has(c.code)) return false;
      seen.add(c.code);
      return true;
    });
  }, [currencies]);

  const getFlagComponent = (currencyCode?: string) => {
    if (!currencyCode) return null;
    const flagMap: Record<string, string> = {
      EUR: 'FR', // Using FR/France for Euro
    };
    const countryCode = flagMap[currencyCode] || currencyCode.substring(0, 2);
    
    // Check if the country flag component is available in flags
    const Flag = flags[countryCode as keyof typeof flags];
    if (!Flag) {
      return (
        <span className="flex h-4 w-6 shrink-0 items-center justify-center rounded-sm bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm">
          🌐
        </span>
      );
    }
    return (
      <span className="flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm [&_svg]:h-full [&_svg]:w-full [&_svg]:object-cover">
        <Flag title={currencyCode} />
      </span>
    );
  };

  const handleAddAccount = () => {
    const newAccount = api.firmBankAccount.factory();
    // Default to TND currency if found in the unique currencies list
    const tndCurrency = uniqueCurrencies.find((c) => c.code === 'TND');
    if (tndCurrency) {
      newAccount.currency = tndCurrency;
      newAccount.currencyId = tndCurrency.id;
    } else if (uniqueCurrencies.length > 0) {
      newAccount.currency = uniqueCurrencies[0];
      newAccount.currencyId = uniqueCurrencies[0].id;
    }
    
    // Set isMain to true if it is the first account
    if (bankAccounts.length === 0) {
      newAccount.isMain = true;
    }

    firmStore.set('bankAccounts', [...bankAccounts, newAccount]);
  };

  const handleRemoveAccount = (index: number) => {
    const updated = [...bankAccounts];
    updated.splice(index, 1);
    
    // If we removed the main account and we still have other accounts, promote the first one to main
    if (bankAccounts[index]?.isMain && updated.length > 0) {
      updated[0].isMain = true;
    }

    firmStore.set('bankAccounts', updated);
  };

  const handleFieldChange = (index: number, field: keyof FirmBankAccount, value: any) => {
    const updated = bankAccounts.map((acc, i) => {
      if (i === index) {
        if (field === 'currency') {
          return {
            ...acc,
            currency: value,
            currencyId: value?.id
          };
        }
        return {
          ...acc,
          [field]: value
        };
      }
      return acc;
    });
    firmStore.set('bankAccounts', updated);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h2 className={sectionTitleClassName}>
              {tContact('firm.sections.bank_accounts')}
            </h2>
            {bankAccounts.length > 0 && (
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                ({bankAccounts.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={handleAddAccount}
              className="h-10 border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              {tContact('firm.commands.add_bank_account')}
            </Button>

            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-10 w-10">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="space-y-4">
          {bankAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950/20">
              <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-900">
                <Landmark className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {tContact('firm.placeholders.no_bank_accounts')}
              </p>
              <Button
                type="button"
                variant="link"
                disabled={loading}
                onClick={handleAddAccount}
                className="text-primary hover:underline font-semibold text-sm h-auto p-0"
              >
                {tContact('firm.commands.add_first_bank_account')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account, index) => (
                <div
                  key={index}
                  className="group relative rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-md"
                >
                  <div className="grid gap-5 md:grid-cols-[1fr_1fr_1fr_auto] items-end">
                    <div className="space-y-2">
                      <Label className={labelClassName}>
                        {tContact('firm.attributes.bank_account_agency')}
                      </Label>
                      <Input
                        className={fieldClassName}
                        disabled={loading}
                        placeholder={tContact('firm.placeholders.bank_account_agency')}
                        value={account.name || ''}
                        onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClassName}>
                        {tContact('firm.attributes.bank_account_iban')}
                      </Label>
                      <Input
                        className={fieldClassName}
                        disabled={loading}
                        placeholder="TN59XXXXXXXXXXXXXXXXXXXX"
                        value={account.iban || ''}
                        onChange={(e) => handleFieldChange(index, 'iban', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClassName}>
                        {tContact('firm.attributes.bank_account_currency')}
                      </Label>
                      <Select
                        value={account.currencyId ? String(account.currencyId) : ''}
                        onValueChange={(val) => {
                          const matched = uniqueCurrencies.find((c) => String(c.id) === val);
                          if (matched) {
                            handleFieldChange(index, 'currency', matched);
                          }
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className={cn(fieldClassName, "flex items-center gap-2")}>
                          <SelectValue placeholder={tContact('firm.attributes.bank_account_currency')}>
                            {account.currency && (
                              <div className="flex items-center gap-2">
                                {getFlagComponent(account.currency.code)}
                                <span>
                                  {account.currency.code} - {tCurrency(account.currency.code || '')}
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueCurrencies.map((currency) => (
                            <SelectItem key={currency.id} value={String(currency.id)}>
                              <div className="flex items-center gap-2">
                                {getFlagComponent(currency.code)}
                                <span>
                                  {currency.code} - {tCurrency(currency.code || '')}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end pt-2 md:pt-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={loading}
                        onClick={() => handleRemoveAccount(index)}
                        className="h-11 w-11 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
};

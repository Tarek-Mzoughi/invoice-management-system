import React from 'react';
import { Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { cn } from '@/lib/utils';
import {
  BankAccount,
  CreateTreasuryMovementDto,
  TREASURY_MOVEMENT_DIRECTION,
  TREASURY_MOVEMENT_KIND
} from '@/types';

interface TreasuryDepositSheetProps {
  className?: string;
  open: boolean;
  accounts: BankAccount[];
  isPending?: boolean;
  onClose: () => void;
  createDeposit: (data: CreateTreasuryMovementDto) => void;
  defaultAccountId?: number | null;
}

const initialDepositState = {
  accountId: '',
  amount: '',
  reason: '',
  movementDate: new Date().toISOString().slice(0, 10)
};

export const TreasuryDepositSheet: React.FC<TreasuryDepositSheetProps> = ({
  className,
  open,
  accounts,
  isPending,
  onClose,
  createDeposit,
  defaultAccountId
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  const [form, setForm] = React.useState(initialDepositState);

  React.useEffect(() => {
    if (!open) {
      setForm(initialDepositState);
      return;
    }

    if (defaultAccountId) {
      setForm((current) => ({
        ...current,
        accountId: defaultAccountId.toString()
      }));
    } else if (accounts.length > 0) {
      setForm((current) => ({
        ...current,
        accountId: accounts.find((account) => account.isMain)?.id?.toString() || accounts[0].id?.toString() || ''
      }));
    }
  }, [open, defaultAccountId, accounts]);

  const targetAccount = accounts.find((account) => account.id?.toString() === form.accountId);

  const handleSubmit = () => {
    const amount = Number(form.amount);

    if (!form.accountId) {
      toast.error(tSettings('bank_account.deposit.errors.account_required'));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(tSettings('bank_account.deposit.errors.amount_required'));
      return;
    }

    if (!form.movementDate) {
      toast.error(tSettings('bank_account.deposit.errors.date_required'));
      return;
    }

    const data: CreateTreasuryMovementDto = {
      accountId: Number(form.accountId),
      currencyId: targetAccount?.currencyId || targetAccount?.currency?.id,
      kind: TREASURY_MOVEMENT_KIND.INCOME,
      direction: TREASURY_MOVEMENT_DIRECTION.IN,
      amount,
      label: tSettings('bank_account.deposit.default_label'),
      notes: form.reason.trim(),
      movementDate: new Date(form.movementDate).toISOString()
    };

    createDeposit(data);
  };

  const currencySymbol = targetAccount?.currency?.symbol || targetAccount?.currency?.code || 'DT';

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent
        hideClose
        className={cn(
          'w-full border-l border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:max-w-[590px]',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
            <SheetTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {tSettings('bank_account.deposit.title')}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {tSettings('bank_account.deposit.description')}
            </SheetDescription>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 rounded-sm border-zinc-200 text-sm dark:border-zinc-700"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                {tCommon('commands.close')}
              </Button>
              <Button
                type="button"
                className="h-8 gap-1.5 rounded-sm text-sm"
                onClick={handleSubmit}
                disabled={isPending}
              >
                <Save className="h-3.5 w-3.5" />
                {tSettings('bank_account.deposit.add_button_label')}
                <Spinner show={isPending} />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-6 py-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {tSettings('bank_account.deposit.fields.amount')}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    className="h-9"
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm text-zinc-500">{currencySymbol}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {tSettings('bank_account.deposit.fields.movementDate')}
                </Label>
                <Input
                  type="date"
                  className="h-9"
                  value={form.movementDate}
                  onChange={(event) => setForm({ ...form, movementDate: event.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {tSettings('bank_account.deposit.fields.account')}
                </Label>
                <Select value={form.accountId} onValueChange={(value) => setForm({ ...form, accountId: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={tSettings('bank_account.deposit.placeholders.account')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id?.toString() || ''}>
                        {account.name} {account.currency?.code ? `(${account.currency.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {tSettings('bank_account.deposit.fields.reason')}
                </Label>
                <Textarea
                  placeholder={tSettings('bank_account.deposit.placeholders.reason')}
                  className="min-h-[100px] resize-none text-sm"
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

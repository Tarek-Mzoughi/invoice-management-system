import React from 'react';
import { Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { BankAccountForm } from '../BankAccountForm';

interface BankAccountCreateDialogProps {
  className?: string;
  open: boolean;
  createBankAccount: () => void;
  isCreatePending?: boolean;
  onClose: () => void;
  mainByDefault: boolean;
}

export const BankAccountCreateDialog: React.FC<BankAccountCreateDialogProps> = ({
  className,
  open,
  createBankAccount,
  isCreatePending,
  onClose,
  mainByDefault
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
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
            <div className="space-y-1">
              <SheetTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {tSettings('bank_account.new')}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {tSettings('bank_account.hints.create_dialog_hint')}
              </SheetDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-2 rounded-sm border-zinc-200 dark:border-zinc-700"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                {tCommon('commands.cancel')}
              </Button>
              <Button
                type="button"
                className="h-8 gap-2 rounded-sm"
                onClick={createBankAccount}
              >
                <Save className="h-4 w-4" />
                {tCommon('commands.create')}
                <Spinner show={isCreatePending} />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-6 py-6">
              <BankAccountForm className="gap-4" mainByDefault={mainByDefault} />
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

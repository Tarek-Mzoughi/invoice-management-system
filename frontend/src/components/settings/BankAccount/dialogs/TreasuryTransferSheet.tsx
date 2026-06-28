import React from 'react';
import { Upload, X } from 'lucide-react';
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

const MAX_FILES = 10;
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ACCEPTED_FILE_LABEL = 'PDF, JPEG, JPG, PNG';

interface TreasuryTransferSheetProps {
  className?: string;
  open: boolean;
  accounts: BankAccount[];
  isPending?: boolean;
  onClose: () => void;
  createTransfer: (
    sourceData: CreateTreasuryMovementDto,
    destinationData: CreateTreasuryMovementDto
  ) => void;
  defaultSourceAccountId?: number | null;
}

const initialTransferState = {
  sourceAccountId: '',
  destinationAccountId: '',
  amount: '',
  reason: '',
  movementDate: new Date().toISOString().slice(0, 10)
};

export const TreasuryTransferSheet: React.FC<TreasuryTransferSheetProps> = ({
  className,
  open,
  accounts,
  isPending,
  onClose,
  createTransfer,
  defaultSourceAccountId
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  const [form, setForm] = React.useState(initialTransferState);
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setForm(initialTransferState);
      setFiles([]);
      return;
    }

    if (defaultSourceAccountId) {
      setForm((current) => ({
        ...current,
        sourceAccountId: defaultSourceAccountId.toString()
      }));
    }
  }, [open, defaultSourceAccountId]);

  const sourceAccount = accounts.find((account) => account.id?.toString() === form.sourceAccountId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).filter((file) => {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(
          tSettings('bank_account.transfer.errors.unsupported_file', {
            name: file.name,
            accepted: ACCEPTED_FILE_LABEL
          })
        );
        return false;
      }

      return true;
    });

    setFiles((previousFiles) => {
      const combinedFiles = [...previousFiles, ...newFiles];
      if (combinedFiles.length > MAX_FILES) {
        toast.error(tSettings('bank_account.transfer.errors.max_files', { count: MAX_FILES }));
        return combinedFiles.slice(0, MAX_FILES);
      }
      return combinedFiles;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((previousFiles) => previousFiles.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = () => {
    const amount = Number(form.amount);

    if (!form.sourceAccountId) {
      toast.error(tSettings('bank_account.transfer.errors.source_account_required'));
      return;
    }

    if (!form.destinationAccountId) {
      toast.error(tSettings('bank_account.transfer.errors.destination_account_required'));
      return;
    }

    if (form.sourceAccountId === form.destinationAccountId) {
      toast.error(tSettings('bank_account.transfer.errors.same_account'));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(tSettings('bank_account.transfer.errors.amount_required'));
      return;
    }

    if (!form.movementDate) {
      toast.error(tSettings('bank_account.transfer.errors.date_required'));
      return;
    }

    const destinationAccount = accounts.find(
      (account) => account.id?.toString() === form.destinationAccountId
    );

    const commonData = {
      kind: TREASURY_MOVEMENT_KIND.TRANSFER,
      amount,
      label: tSettings('bank_account.transfer.default_label'),
      notes: form.reason.trim(),
      movementDate: new Date(form.movementDate).toISOString()
    };

    const sourceData: CreateTreasuryMovementDto = {
      ...commonData,
      accountId: Number(form.sourceAccountId),
      currencyId: sourceAccount?.currencyId || sourceAccount?.currency?.id,
      direction: TREASURY_MOVEMENT_DIRECTION.OUT
    };

    const destinationData: CreateTreasuryMovementDto = {
      ...commonData,
      accountId: Number(form.destinationAccountId),
      currencyId: destinationAccount?.currencyId || destinationAccount?.currency?.id,
      direction: TREASURY_MOVEMENT_DIRECTION.IN
    };

    createTransfer(sourceData, destinationData);
  };

  const currencySymbol = sourceAccount?.currency?.symbol || sourceAccount?.currency?.code || 'DT';

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
              {tSettings('bank_account.transfer.title')}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {tSettings('bank_account.transfer.description')}
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
                className="h-8 gap-1.5 rounded-sm bg-blue-600 text-sm text-white hover:bg-blue-700"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {tSettings('bank_account.transfer.add_button_label')}
                <Spinner show={isPending} />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {tSettings('bank_account.transfer.fields.amount')}
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
                    {tSettings('bank_account.transfer.fields.movementDate')}
                  </Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={form.movementDate}
                    onChange={(event) => setForm({ ...form, movementDate: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {tSettings('bank_account.transfer.fields.source_account')}
                </Label>
                <Select
                  value={form.sourceAccountId}
                  onValueChange={(value) => setForm({ ...form, sourceAccountId: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={tSettings('bank_account.transfer.placeholders.source_account')}
                    />
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
                  {tSettings('bank_account.transfer.fields.destination_account')}
                </Label>
                <Select
                  value={form.destinationAccountId}
                  onValueChange={(value) => setForm({ ...form, destinationAccountId: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={tSettings('bank_account.transfer.placeholders.destination_account')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((account) => account.id?.toString() !== form.sourceAccountId)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id?.toString() || ''}>
                          {account.name} {account.currency?.code ? `(${account.currency.code})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {tSettings('bank_account.transfer.fields.reason')}
                </Label>
                <Textarea
                  placeholder={tSettings('bank_account.transfer.placeholders.reason')}
                  className="min-h-[100px] resize-none text-sm"
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {tSettings('bank_account.transfer.fields.attachments')}
                </Label>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpeg,.jpg,.png"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <button
                  type="button"
                  className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
                    <Upload className="h-5 w-5 text-zinc-500 dark:text-zinc-300" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {tSettings('bank_account.transfer.attachments.upload_title')}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {tSettings('bank_account.transfer.attachments.helper', { count: MAX_FILES })}
                    </p>
                  </div>
                </button>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-xs text-zinc-400">📄</span>
                          <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                            {file.name}
                          </span>
                          <span className="shrink-0 text-xs text-zinc-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-zinc-400 hover:text-rose-500"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

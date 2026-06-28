import React from 'react';
import { Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  BankAccount,
  CreateTreasuryMovementDto,
  TREASURY_MOVEMENT_DIRECTION,
  TREASURY_MOVEMENT_KIND
} from '@/types';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ExpenseCategory {
  id: string;
  label: string;
  icon: string;
}

const CATEGORY_ICONS = ['💰', '🏛️', '🏠', '🚗', '💡', '📦', '🛠️', '📱', '🍽️', '✈️', '🏥', '📝', ''];
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ACCEPTED_FILE_LABEL = 'PDF, JPEG, JPG, PNG';
const MAX_FILES = 10;

const initialExpenseState = {
  accountId: '',
  amount: '',
  label: '',
  notes: '',
  categoryId: '',
  withholding: false,
  projectId: '',
  movementDate: new Date().toISOString().slice(0, 10)
};

const buildDefaultCategories = (
  tSettings: (key: string, options?: Record<string, unknown>) => string
): ExpenseCategory[] => [
  { id: 'salaires', label: tSettings('bank_account.expense.categories.salaries'), icon: '💰' },
  { id: 'impots', label: tSettings('bank_account.expense.categories.taxes'), icon: '🏛️' },
  { id: 'loyer', label: tSettings('bank_account.expense.categories.rent'), icon: '🏠' },
  { id: 'autre', label: tSettings('bank_account.expense.categories.other'), icon: '' }
];

interface CategoryManagerDialogProps {
  open: boolean;
  categories: ExpenseCategory[];
  onClose: () => void;
  onCategoriesChange: (categories: ExpenseCategory[]) => void;
}

const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  open,
  categories,
  onClose,
  onCategoriesChange
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editLabel, setEditLabel] = React.useState('');
  const [editIcon, setEditIcon] = React.useState('');

  const handleStartEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setEditLabel(category.label);
    setEditIcon(category.icon);
  };

  const handleSaveEdit = () => {
    if (!editLabel.trim()) return;
    onCategoriesChange(
      categories.map((category) =>
        category.id === editingId ? { ...category, label: editLabel.trim(), icon: editIcon } : category
      )
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onCategoriesChange(categories.filter((category) => category.id !== id));
  };

  const handleAdd = () => {
    const newId = `cat_${Date.now()}`;
    const newCategory: ExpenseCategory = { id: newId, label: '', icon: '' };
    onCategoriesChange([...categories, newCategory]);
    setEditingId(newId);
    setEditLabel('');
    setEditIcon('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-full max-w-md p-0">
        <div className="px-6 pb-2 pt-6">
          <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {tSettings('bank_account.expense.category_dialog.title')}
          </DialogTitle>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 px-6 py-3">
              {editingId === category.id ? (
                <>
                  <select
                    className="h-8 w-12 rounded border border-zinc-200 text-center text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    value={editIcon}
                    onChange={(event) => setEditIcon(event.target.value)}
                  >
                    {CATEGORY_ICONS.map((icon, index) => (
                      <option key={index} value={icon}>
                        {icon || '—'}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="h-8 flex-1 text-sm"
                    value={editLabel}
                    autoFocus
                    onChange={(event) => setEditLabel(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleSaveEdit()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                    onClick={handleSaveEdit}
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="w-6 text-center text-base">{category.icon}</span>
                  <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{category.label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
                    onClick={() => handleStartEdit(category)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-400 hover:text-rose-600"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-100 px-6 py-3 dark:border-zinc-700">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4" />
            {tSettings('bank_account.expense.actions.add_category')}
          </button>
        </div>

        <div className="flex justify-end border-t border-zinc-100 px-6 py-3 dark:border-zinc-700">
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-sm border-zinc-200 text-sm dark:border-zinc-700"
            onClick={onClose}
          >
            {tCommon('commands.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface TreasuryExpenseSheetProps {
  className?: string;
  open: boolean;
  accounts: BankAccount[];
  isPending?: boolean;
  onClose: () => void;
  createExpense: (data: CreateTreasuryMovementDto) => void;
}

export const TreasuryExpenseSheet: React.FC<TreasuryExpenseSheetProps> = ({
  className,
  open,
  accounts,
  isPending,
  onClose,
  createExpense
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  const [form, setForm] = React.useState(initialExpenseState);
  const [categories, setCategories] = React.useState<ExpenseCategory[]>(() =>
    buildDefaultCategories(tSettings)
  );
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setForm(initialExpenseState);
      setFiles([]);
      setCategories(buildDefaultCategories(tSettings));
      return;
    }

    const defaultAccount = accounts.find((account) => account.isMain) || accounts[0];
    setForm((current) => ({
      ...current,
      accountId: defaultAccount?.id?.toString() || ''
    }));
  }, [accounts, open, tSettings]);

  const selectedAccount = React.useMemo(
    () => accounts.find((account) => account.id?.toString() === form.accountId),
    [accounts, form.accountId]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).filter((file) => {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(
          tSettings('bank_account.expense.errors.unsupported_file', {
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
        toast.error(tSettings('bank_account.expense.errors.max_files', { count: MAX_FILES }));
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
    const currencyId = selectedAccount?.currencyId || selectedAccount?.currency?.id;

    if (!form.accountId) {
      toast.error(tSettings('bank_account.expense.errors.account_required'));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(tSettings('bank_account.expense.errors.amount_required'));
      return;
    }

    if (!form.movementDate) {
      toast.error(tSettings('bank_account.expense.errors.date_required'));
      return;
    }

    if (!currencyId) {
      toast.error(tSettings('bank_account.expense.errors.account_required'));
      return;
    }

    const selectedCategory = categories.find((category) => category.id === form.categoryId);

    createExpense({
      accountId: Number(form.accountId),
      currencyId,
      kind: TREASURY_MOVEMENT_KIND.EXPENSE,
      direction: TREASURY_MOVEMENT_DIRECTION.OUT,
      amount,
      label: selectedCategory?.label || form.label.trim() || tSettings('bank_account.expense.default_label'),
      notes: form.notes.trim(),
      movementDate: new Date(form.movementDate).toISOString()
    });
  };

  const currencySymbol = selectedAccount?.currency?.symbol || selectedAccount?.currency?.code || 'DT';

  return (
    <>
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
              <SheetTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {tSettings('bank_account.expense.title')}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {tSettings('bank_account.expense.description')}
              </SheetDescription>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 gap-1.5 rounded-sm text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
                  {tCommon('commands.create')}
                  <Spinner show={isPending} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-5 px-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {tSettings('bank_account.expense.fields.amount')}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        className="h-10 pr-12 text-sm"
                        value={form.amount}
                        placeholder={tSettings('bank_account.expense.placeholders.amount')}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, amount: event.target.value }))
                        }
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-zinc-400">
                        {currencySymbol}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {tSettings('bank_account.expense.fields.movementDate')}
                    </Label>
                    <Input
                      type="date"
                      className="h-10 text-sm"
                      value={form.movementDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          movementDate: event.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {tSettings('bank_account.expense.fields.account')}
                  </Label>
                  <Select
                    value={form.accountId}
                    onValueChange={(value) => setForm((current) => ({ ...current, accountId: value }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={tSettings('bank_account.expense.placeholders.account')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id?.toString() || ''}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {tSettings('bank_account.expense.fields.category')}
                    </Label>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
                      onClick={() => {
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                        setCategoryDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      {tSettings('bank_account.expense.actions.manage_categories')}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-sm transition-all',
                          form.categoryId === category.id
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700'
                        )}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            categoryId: current.categoryId === category.id ? '' : category.id
                          }))
                        }
                      >
                        {category.icon && <span className="text-sm">{category.icon}</span>}
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {tSettings('bank_account.expense.fields.withholding')}
                  </Label>
                  <div className="flex overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      className={cn(
                        'px-4 py-1.5 text-xs font-medium transition-colors',
                        !form.withholding
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300'
                          : 'bg-white text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                      )}
                      onClick={() => setForm((current) => ({ ...current, withholding: false }))}
                    >
                      {tCommon('answer.no')}
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'px-4 py-1.5 text-xs font-medium transition-colors',
                        form.withholding
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300'
                          : 'bg-white text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                      )}
                      onClick={() => setForm((current) => ({ ...current, withholding: true }))}
                    >
                      {tCommon('answer.yes')}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {tSettings('bank_account.expense.fields.project')}
                  </Label>
                  <Select
                    value={form.projectId}
                    onValueChange={(value) => setForm((current) => ({ ...current, projectId: value }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={tSettings('bank_account.expense.placeholders.project')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {tSettings('bank_account.expense.placeholders.no_project')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {tSettings('bank_account.expense.fields.reason')}
                  </Label>
                  <Textarea
                    value={form.notes}
                    rows={3}
                    className="text-sm"
                    placeholder={tSettings('bank_account.expense.placeholders.reason')}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {tSettings('bank_account.expense.fields.attachments')}
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
                    className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-8 text-center transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-950 dark:text-sky-400">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {tSettings('bank_account.expense.attachments.upload_title')}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {tSettings('bank_account.expense.attachments.helper', { count: MAX_FILES })}
                      </p>
                    </div>
                  </button>

                  {files.length > 0 && (
                    <div className="mt-2 space-y-1.5">
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

      <CategoryManagerDialog
        open={categoryDialogOpen}
        categories={categories}
        onClose={() => setCategoryDialogOpen(false)}
        onCategoriesChange={setCategories}
      />
    </>
  );
};

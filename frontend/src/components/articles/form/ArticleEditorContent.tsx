import React from 'react';
import {
  BadgeDollarSign,
  Building2,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Package,
  Plus,
  ShoppingCart,
  Sticker,
  Trash2,
  Upload,
  Wrench,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PriceListFormDialog } from '@/components/price-lists/PriceListFormDialog';
import usePriceLists from '@/hooks/content/usePriceLists';
import { cn } from '@/lib/utils';
import { PriceList, Tax, TaxWithholding } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { useArticleManager } from '../hooks/useArticleManager';

interface ArticleEditorContentProps {
  loading?: boolean;
  taxes?: Tax[];
}

const fieldClassName =
  'h-11 rounded-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950';
const labelClassName = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const sectionTitleClassName = 'text-2xl font-semibold text-zinc-950 dark:text-zinc-50';

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  label: string;
}

const FormField = ({ children, className, label }: FormFieldProps) => (
  <div className={cn('space-y-2', className)}>
    <Label className={labelClassName}>{label}</Label>
    {children}
  </div>
);

interface TileOption {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const SelectionTile = ({ active, icon, label, onClick }: TileOption) => (
  <button
    type="button"
    className={cn(
      'flex h-14 items-center justify-center gap-3 rounded-md border px-5 text-base font-semibold transition',
      active
        ? 'border-primary bg-primary/10 text-primary shadow-sm'
        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700'
    )}
    onClick={onClick}>
    {icon}
    <span>{label}</span>
    {active && <CheckCircle2 className="ml-auto h-5 w-5" />}
  </button>
);

interface ArticleTagSelectorProps {
  addLabel: string;
  disabled?: boolean;
  options: { id?: number; label?: string }[];
  selectedIds: number[];
  onChange: (value: number[]) => void;
}

const ArticleTagSelector = ({
  addLabel,
  disabled,
  options,
  selectedIds,
  onChange
}: ArticleTagSelectorProps) => {
  const toggleValue = (id?: number) => {
    if (!id) return;
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id]
    );
  };

  const selectedOptions = options.filter((option) => option.id && selectedIds.includes(option.id));

  return (
    <div className="flex flex-wrap gap-3">
      {selectedOptions.map((option) => (
        <Button
          key={option.id}
          type="button"
          variant="outline"
          className="h-10 rounded-md px-5"
          onClick={() => toggleValue(option.id)}>
          {option.label}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-10 rounded-full px-4" disabled={disabled}>
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder={addLabel} />
            <CommandList>
              <CommandEmpty>{addLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = Boolean(option.id && selectedIds.includes(option.id));
                  return (
                    <CommandItem key={option.id} onSelect={() => toggleValue(option.id)}>
                      <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface ImageUploadProps {
  disabled?: boolean;
  imageId?: number;
  label: string;
  value?: File;
  onChange: (value?: File) => void;
}

const ArticleImageUpload = ({ disabled, imageId, label, value, onChange }: ImageUploadProps) => {
  const { t: tArticles } = useTranslation('articles');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState('');

  React.useEffect(() => {
    let nextUrl = '';
    let isMounted = true;

    const loadPreview = async () => {
      if (value) {
        nextUrl = URL.createObjectURL(value);
        if (isMounted) {
          setPreviewUrl(nextUrl);
        }
        return;
      }

      if (!imageId) {
        if (isMounted) {
          setPreviewUrl('');
        }
        return;
      }

      const blob = await api.upload.fetchBlobById(imageId);
      if (!blob || !isMounted) {
        setPreviewUrl('');
        return;
      }

      nextUrl = URL.createObjectURL(blob);
      setPreviewUrl(nextUrl);
    };

    loadPreview();

    return () => {
      isMounted = false;
      if (nextUrl) {
        URL.revokeObjectURL(nextUrl);
      }
    };
  }, [imageId, value]);

  return (
    <div className="space-y-2">
      <Label className={labelClassName}>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        disabled={disabled}
        onChange={(event) => onChange(event.target.files?.[0])}
      />
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-[255px] w-full items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 text-center transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
          {previewUrl ? (
            <img src={previewUrl} alt={label} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <div className="space-y-3 px-6 text-zinc-500 dark:text-zinc-400">
              <Upload className="mx-auto h-10 w-10" />
              <p className="text-base font-medium">{tArticles('placeholders.upload_image')}</p>
            </div>
          )}
        </button>
        {previewUrl ? (
          <div className="flex justify-end">
            <Button type="button" variant="ghost" className="h-9 px-3" onClick={() => onChange(undefined)}>
              <X className="h-4 w-4" />
              {tArticles('actions.remove_image')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface AttachmentUploaderProps {
  disabled?: boolean;
  existingCount?: number;
  value?: File[];
  onChange: (value: File[]) => void;
}

const ArticleAttachmentUploader = ({
  disabled,
  existingCount = 0,
  value = [],
  onChange
}: AttachmentUploaderProps) => {
  const { t: tArticles } = useTranslation('articles');
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFiles = (files?: FileList | null) => {
    if (!files) return;
    const nextFiles = [...value, ...Array.from(files)].slice(0, 10);
    onChange(nextFiles);
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpeg,.jpg,.png"
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[118px] w-full items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 text-center transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
        <div className="space-y-2 text-zinc-500 dark:text-zinc-400">
          <Upload className="mx-auto h-10 w-10" />
          <p className="text-lg font-medium">{tArticles('placeholders.upload_attachments')}</p>
          <p className="text-sm">{tArticles('placeholders.upload_attachments_hint')}</p>
        </div>
      </button>

      {existingCount > 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {tArticles('messages.existing_attachments_kept', { count: existingCount })}
        </p>
      ) : null}

      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
              <span className="truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => onChange(value.filter((_, fileIndex) => fileIndex !== index))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface ArticlePriceListSelectorProps {
  disabled?: boolean;
  value?: Array<{
    priceListId: number;
    type: 'fixed' | 'percentage';
    salePrice: number;
    purchasePrice: number;
  }>;
  onChange: (newValue: Array<{
    priceListId: number;
    type: 'fixed' | 'percentage';
    salePrice: number;
    purchasePrice: number;
  }>) => void;
}

const ArticlePriceListSelector = ({
  disabled,
  value = [],
  onChange
}: ArticlePriceListSelectorProps) => {
  const queryClient = useQueryClient();
  const { t: tArticles } = useTranslation('articles');
  const { t: tSettings } = useTranslation('settings');
  const [open, setOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const { priceLists, isFetchPriceListsPending } = usePriceLists({
    silentForbiddenToast: true
  });

  const availablePriceLists = React.useMemo(() => {
    return priceLists.filter(
      (priceList) => priceList.id && !value.some((item) => item.priceListId === priceList.id)
    );
  }, [priceLists, value]);

  const { mutate: createPriceList, isPending: isCreatePending } = useMutation({
    mutationFn: (data: PriceList) => api.priceList.create(data),
    onSuccess: async (createdPriceList) => {
      await queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      if (createdPriceList?.id) {
        handleAddPriceList(createdPriceList.id);
      }
      setCreateDialogOpen(false);
      setOpen(false);
      toast.success(tSettings('price_lists.messages.create_success'));
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage('settings', mutationError, tSettings('price_lists.messages.create_error'))
      );
    }
  });

  const handleCreate = (payload: PriceList) => {
    const validation = api.priceList.validate(payload);
    if (validation.message) {
      toast.error(tSettings(validation.message.replace('settings:', '')));
      return;
    }
    createPriceList(payload);
  };

  const handleAddPriceList = (priceListId: number) => {
    const newItem = {
      priceListId,
      type: 'fixed' as const,
      salePrice: 0,
      purchasePrice: 0
    };
    onChange([...value, newItem]);
  };

  const handleRemovePriceList = (priceListId: number) => {
    onChange(value.filter((item) => item.priceListId !== priceListId));
  };

  const handleUpdateItem = (priceListId: number, fields: Partial<(typeof value)[number]>) => {
    onChange(
      value.map((item) => (item.priceListId === priceListId ? { ...item, ...fields } : item))
    );
  };

  return (
    <>
      <PriceListFormDialog
        open={createDialogOpen}
        pending={isCreatePending}
        title={tSettings('price_lists.dialogs.create_title')}
        description={tSettings('price_lists.dialogs.create_description')}
        submitLabel={tArticles('actions.create_price_list')}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isFetchPriceListsPending}
            className={cn(fieldClassName, 'w-full justify-between px-3 font-normal')}>
            <span className="truncate text-muted-foreground">
              {tArticles('placeholders.select_price_list')}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={tArticles('placeholders.search_price_lists')} />
            <CommandList>
              <CommandEmpty>{tArticles('messages.no_price_lists')}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value={tArticles('actions.add_price_list')}
                  className="bg-amber-100 text-amber-950 data-[selected=true]:bg-amber-200 dark:bg-amber-950 dark:text-amber-100"
                  onSelect={() => {
                    setOpen(false);
                    setCreateDialogOpen(true);
                  }}>
                  <Plus className="mr-2 h-4 w-4" />
                  {tArticles('actions.add_price_list')}
                </CommandItem>
                {availablePriceLists.map((priceList) => (
                  <CommandItem
                    key={priceList.id}
                    value={priceList.name || ''}
                    onSelect={() => {
                      if (priceList.id) {
                        handleAddPriceList(priceList.id);
                      }
                      setOpen(false);
                    }}>
                    {priceList.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="space-y-4 pt-2">
          {value.map((item) => {
            const priceList = priceLists.find((pl) => pl.id === item.priceListId);
            const name = priceList?.name || tArticles('singular');

            return (
              <div
                key={item.priceListId}
                className="rounded-lg border border-zinc-200 p-4 space-y-4 shadow-sm bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">{name}</span>
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {item.type === 'fixed' ? 'Prix Fixe' : 'Pourcentage'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-red-500"
                    onClick={() => handleRemovePriceList(item.priceListId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className={labelClassName}>Type de Prix</Label>
                    <Select
                      disabled={disabled}
                      value={item.type}
                      onValueChange={(val) =>
                        handleUpdateItem(item.priceListId, {
                          type: val as 'fixed' | 'percentage'
                        })
                      }>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Prix Fixe</SelectItem>
                        <SelectItem value="percentage">Pourcentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClassName}>Prix de Vente</Label>
                    <div className="relative">
                      <Input
                        disabled={disabled}
                        type="number"
                        inputMode="decimal"
                        step="0.001"
                        className="h-11 pr-10"
                        value={item.salePrice ?? 0}
                        onChange={(e) =>
                          handleUpdateItem(item.priceListId, {
                            salePrice: Number(e.target.value)
                          })
                        }
                      />
                      <span className="absolute right-3 top-3 text-sm text-zinc-400 font-medium">
                        {item.type === 'fixed' ? 'DT' : '%'}
                      </span>
                    </div>
                    {item.type === 'percentage' && (
                      <p className="text-xs text-zinc-400">
                        Enter percentage adjustment for base price
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClassName}>{"Prix d'Achat"}</Label>
                    <div className="relative">
                      <Input
                        disabled={disabled}
                        type="number"
                        inputMode="decimal"
                        step="0.001"
                        className="h-11 pr-10"
                        value={item.purchasePrice ?? 0}
                        onChange={(e) =>
                          handleUpdateItem(item.priceListId, {
                            purchasePrice: Number(e.target.value)
                          })
                        }
                      />
                      <span className="absolute right-3 top-3 text-sm text-zinc-400 font-medium">
                        {item.type === 'fixed' ? 'DT' : '%'}
                      </span>
                    </div>
                    {item.type === 'percentage' && (
                      <p className="text-xs text-zinc-400">
                        Enter percentage adjustment for base price
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

const ensureCurrentValue = (
  options: { value: string; label: string }[],
  current?: string
) => {
  if (!current || options.some((option) => option.value === current)) {
    return options;
  }

  return [{ value: current, label: current }, ...options];
};

export const ArticleEditorContent = ({
  loading,
  taxes = []
}: ArticleEditorContentProps) => {
  const articleManager = useArticleManager();
  const { t: tArticles } = useTranslation('articles');

  const vatTaxes = React.useMemo(() => {
    return taxes.filter((t) => !t.isSpecial);
  }, [taxes]);

  const additionalTaxes = React.useMemo(() => {
    return taxes.filter((t) => t.isSpecial);
  }, [taxes]);

  React.useEffect(() => {
    if (articleManager.destination !== 'buying' && articleManager.articleType === 'asset') {
      articleManager.set('articleType', 'product');
    }
  }, [articleManager.destination, articleManager.articleType]);

  const unitOptions = ensureCurrentValue(
    [
      { value: 'Pièce', label: tArticles('options.unit_piece') },
      { value: 'Kg', label: tArticles('options.unit_kg') },
      { value: 'Heure', label: tArticles('options.unit_hour') },
      { value: 'Jour', label: tArticles('options.unit_day') }
    ],
    articleManager.unit
  );

  const familyOptions = ensureCurrentValue(
    [
      { value: 'Famille par défaut', label: tArticles('options.family_default') },
      { value: 'Produits', label: tArticles('options.family_products') },
      { value: 'Services', label: tArticles('options.family_services') },
      { value: 'Immobilisations', label: tArticles('options.family_assets') }
    ],
    articleManager.family
  );

  const subFamilyOptions = ensureCurrentValue(
    [
      { value: 'Sous-famille par défaut', label: tArticles('options.sub_family_default') },
      { value: 'Standard', label: tArticles('options.sub_family_standard') },
      { value: 'Premium', label: tArticles('options.sub_family_premium') }
    ],
    articleManager.subFamily
  );

  const brandOptions = ensureCurrentValue(
    [
      { value: 'Marque par défaut', label: tArticles('options.brand_default') },
      { value: 'Générique', label: tArticles('options.brand_generic') }
    ],
    articleManager.brand
  );

  const isProduct = articleManager.articleType === 'product';
  const isService = articleManager.articleType === 'service';
  const isAsset = articleManager.articleType === 'asset';
  const isSelling = articleManager.destination === 'selling';
  const isBuying = articleManager.destination === 'buying';
  const isBoth = articleManager.destination === 'both';

  const titleLabel = isService
    ? tArticles('fields.service_name')
    : isAsset
      ? tArticles('fields.asset_name')
      : tArticles('fields.article_name');
  const titlePlaceholder = isService
    ? tArticles('placeholders.service_name')
    : isAsset
      ? tArticles('placeholders.asset_name')
      : tArticles('placeholders.article_name');

  const discountLabel = isBuying && !isBoth
    ? tArticles('fields.purchase_discount')
    : isBoth
      ? tArticles('fields.default_discount')
      : tArticles('fields.sale_discount');

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className={sectionTitleClassName}>{tArticles('sections.destination')}</h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <SelectionTile
            active={articleManager.destination === 'selling'}
            icon={<BadgeDollarSign className="h-5 w-5" />}
            label={tArticles('destination.selling')}
            onClick={() => articleManager.set('destination', 'selling')}
          />
          <SelectionTile
            active={articleManager.destination === 'buying'}
            icon={<ShoppingCart className="h-5 w-5" />}
            label={tArticles('destination.buying')}
            onClick={() => articleManager.set('destination', 'buying')}
          />
          <SelectionTile
            active={articleManager.destination === 'both'}
            icon={<BadgeDollarSign className="h-5 w-5" />}
            label={tArticles('destination.both')}
            onClick={() => articleManager.set('destination', 'both')}
          />
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className={sectionTitleClassName}>{tArticles('sections.article_type')}</h2>
        </div>

        <div className={cn('grid gap-3', isBuying ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>
          <SelectionTile
            active={articleManager.articleType === 'product'}
            icon={<Package className="h-5 w-5" />}
            label={tArticles('type.product')}
            onClick={() => articleManager.set('articleType', 'product')}
          />
          <SelectionTile
            active={articleManager.articleType === 'service'}
            icon={<Wrench className="h-5 w-5" />}
            label={tArticles('type.service')}
            onClick={() => articleManager.set('articleType', 'service')}
          />
          {isBuying ? (
            <SelectionTile
              active={articleManager.articleType === 'asset'}
              icon={<Building2 className="h-5 w-5" />}
              label={tArticles('type.asset')}
              onClick={() => articleManager.set('articleType', 'asset')}
            />
          ) : null}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_320px]">
        <div className="space-y-5">
          <FormField label={titleLabel}>
            <Input
              className={fieldClassName}
              disabled={loading}
              placeholder={titlePlaceholder}
              value={articleManager.title || ''}
              onChange={(event) => articleManager.set('title', event.target.value)}
            />
          </FormField>

          <FormField label={tArticles('fields.reference')}>
            <Input
              className={fieldClassName}
              disabled={loading}
              placeholder={tArticles('placeholders.reference')}
              value={articleManager.reference || ''}
              onChange={(event) => articleManager.set('reference', event.target.value)}
            />
          </FormField>

          <FormField label={tArticles('fields.description')}>
            <Textarea
              className="min-h-[140px] rounded-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              disabled={loading}
              placeholder={tArticles('placeholders.description')}
              value={articleManager.description || ''}
              onChange={(event) => articleManager.set('description', event.target.value)}
            />
          </FormField>

          <div className="space-y-3">
            <Label className={labelClassName}>{tArticles('fields.vat')}</Label>
            <ArticleTagSelector
              addLabel={tArticles('actions.add_vat')}
              disabled={loading}
              options={vatTaxes}
              selectedIds={articleManager.taxIds}
              onChange={(value) => articleManager.set('taxIds', value)}
            />
          </div>

          <div className="space-y-3">
            <Label className={labelClassName}>{tArticles('fields.additional_taxes')}</Label>
            <ArticleTagSelector
              addLabel={tArticles('actions.add_additional_tax')}
              disabled={loading}
              options={additionalTaxes}
              selectedIds={articleManager.additionalTaxIds}
              onChange={(value) => articleManager.set('additionalTaxIds', value)}
            />
          </div>

          <div className={cn('grid gap-5', isBoth ? 'lg:grid-cols-2' : 'lg:grid-cols-1')}>
            {(isSelling || isBoth) && (
              <FormField label={tArticles('fields.sale_price')}>
                <div className="relative">
                  <Input
                    className={cn(fieldClassName, 'pr-14')}
                    disabled={loading}
                    type="number"
                    inputMode="decimal"
                    step="0.001"
                    value={articleManager.salePrice ?? ''}
                    onChange={(event) => articleManager.set('salePrice', Number(event.target.value))}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">DT</span>
                </div>
              </FormField>
            )}

            {(isBuying || isBoth) && (
              <FormField label={tArticles('fields.purchase_price')}>
                <div className="relative">
                  <Input
                    className={cn(fieldClassName, 'pr-14')}
                    disabled={loading}
                    type="number"
                    inputMode="decimal"
                    step="0.001"
                    value={articleManager.purchasePrice ?? ''}
                    onChange={(event) =>
                      articleManager.set('purchasePrice', Number(event.target.value))
                    }
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">DT</span>
                </div>
              </FormField>
            )}
          </div>

          {isSelling && !isBoth ? (
            <FormField label={tArticles('fields.production_cost')}>
              <div className="relative">
                <Input
                  className={cn(fieldClassName, 'pr-14')}
                  disabled={loading}
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  value={articleManager.productionCost ?? ''}
                  onChange={(event) => articleManager.set('productionCost', Number(event.target.value))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">DT</span>
              </div>
            </FormField>
          ) : null}
        </div>

        <ArticleImageUpload
          disabled={loading}
          imageId={articleManager.imageId}
          label={tArticles('fields.image')}
          value={articleManager.image}
          onChange={(value) => {
            articleManager.set('image', value);
            if (!value) {
              articleManager.set('imageId', undefined);
            }
          }}
        />
      </section>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className={cn(sectionTitleClassName, 'flex items-center gap-3 text-xl')}>
            <BadgeDollarSign className="h-5 w-5" />
            {tArticles('sections.price_lists')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tArticles('descriptions.price_lists')}
          </p>
        </div>

        <ArticlePriceListSelector
          disabled={loading}
          value={articleManager.priceListPrices}
          onChange={(newValue) => {
            articleManager.set('priceListPrices', newValue);
            // Sync the first item's ID and name to single fields for backward compatibility
            if (newValue.length > 0) {
              articleManager.set('priceListId', newValue[0].priceListId);
            } else {
              articleManager.set('priceListId', undefined);
              articleManager.set('priceListName', '');
            }
          }}
        />
      </section>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {tArticles('sections.family_brand')}
          </h2>
        </div>

        <div className={cn('grid gap-5', isProduct ? 'lg:grid-cols-2' : 'lg:grid-cols-2')}>
          <FormField label={tArticles('fields.unit')}>
            <Select
              value={articleManager.unit || undefined}
              onValueChange={(value) => articleManager.set('unit', value)}
              disabled={loading}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={tArticles('placeholders.select_unit')} />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={tArticles('fields.family')}>
            <Select
              value={articleManager.family || undefined}
              onValueChange={(value) => articleManager.set('family', value)}
              disabled={loading}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={tArticles('placeholders.select_family')} />
              </SelectTrigger>
              <SelectContent>
                {familyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={tArticles('fields.sub_family')}>
            <Select
              value={articleManager.subFamily || undefined}
              onValueChange={(value) => articleManager.set('subFamily', value)}
              disabled={loading}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={tArticles('placeholders.select_sub_family')} />
              </SelectTrigger>
              <SelectContent>
                {subFamilyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {isProduct ? (
            <FormField label={tArticles('fields.brand')}>
              <Select
                value={articleManager.brand || undefined}
                onValueChange={(value) => articleManager.set('brand', value)}
                disabled={loading}>
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tArticles('placeholders.select_brand')} />
                </SelectTrigger>
                <SelectContent>
                  {brandOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}
        </div>

        {isProduct ? (
          <FormField label={tArticles('fields.barcode')}>
            <Input
              className={fieldClassName}
              disabled={loading}
              placeholder={tArticles('placeholders.barcode')}
              value={articleManager.barcode || ''}
              onChange={(event) => articleManager.set('barcode', event.target.value)}
            />
          </FormField>
        ) : null}
      </section>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <section className="space-y-5">
        <FormField label={tArticles('fields.private_notes')}>
          <Textarea
            className="min-h-[120px] rounded-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            disabled={loading}
            placeholder={tArticles('placeholders.private_notes')}
            value={articleManager.privateNotes || ''}
            onChange={(event) => articleManager.set('privateNotes', event.target.value)}
          />
        </FormField>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {tArticles('descriptions.private_notes')}
        </p>
      </section>

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {tArticles('sections.attachments')}
          </h2>
        </div>
        <ArticleAttachmentUploader
          disabled={loading}
          existingCount={articleManager.attachmentIds.length}
          value={articleManager.attachments}
          onChange={(value) => articleManager.set('attachments', value)}
        />
      </section>

      <section className="space-y-5 rounded-lg border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sticker className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {tArticles('sections.usual_discount')}
            </h2>
          </div>

          <Switch
            checked={articleManager.discountEnabled}
            onCheckedChange={(checked) => articleManager.set('discountEnabled', Boolean(checked))}
          />
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {tArticles('descriptions.usual_discount')}
        </p>

        {articleManager.discountEnabled ? (
          <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <FormField label={discountLabel}>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px]">
                <Input
                  className={fieldClassName}
                  disabled={loading}
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  value={articleManager.discountValue ?? ''}
                  onChange={(event) => articleManager.set('discountValue', Number(event.target.value))}
                />

                <Select
                  value={articleManager.discountType || 'percentage'}
                  onValueChange={(value) => articleManager.set('discountType', value)}
                  disabled={loading}>
                  <SelectTrigger className={fieldClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{tArticles('discount_type.percentage')}</SelectItem>
                    <SelectItem value="amount">{tArticles('discount_type.amount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormField>
          </div>
        ) : null}
      </section>
    </div>
  );
};

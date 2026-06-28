import React from 'react';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useTaxManager } from './hooks/useTaxManager';
import { useTaxCreateSheet } from './modals/TaxCreateSheet';
import { useTaxDeleteDialog } from './modals/TaxDeleteDialog';
import { useTaxUpdateSheet } from './modals/TaxUpdateSheet';
import { cn } from '@/lib/utils';
import { Tax } from '@/types';
import { createTaxSchema, updateTaxSchema } from '@/types/validations/tax.validation';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface TaxPortalProps {
  className?: string;
}

type TaxCreateMode = 'vat' | 'custom';

const VAT_TAX_ORDER = [7, 0, 13, 19];
const CUSTOM_TEMPLATE_ORDER = ['timbre fiscal', 'fodec 1%'];

const isVatTax = (tax: Tax) => {
  const label = tax.label?.toLowerCase() || '';
  return label.includes('tva') || label.includes('vat') || (tax.isRate && !tax.isSpecial);
};

const getTaxDisplayOrder = (tax: Tax) => {
  if (isVatTax(tax)) {
    const rate = Number(tax.value ?? 0);
    const index = VAT_TAX_ORDER.findIndex((value) => value === rate);
    return index >= 0 ? index : VAT_TAX_ORDER.length + rate;
  }

  const label = tax.label?.trim().toLowerCase() || '';
  const index = CUSTOM_TEMPLATE_ORDER.findIndex((value) => value === label);
  return tax.isTemplate ? 100 + (index >= 0 ? index : CUSTOM_TEMPLATE_ORDER.length) : 200;
};

const sortTaxesForDisplay = (a: Tax, b: Tax) => {
  const orderDelta = getTaxDisplayOrder(a) - getTaxDisplayOrder(b);
  if (orderDelta !== 0) return orderDelta;
  return (a.label || '').localeCompare(b.label || '');
};

const formatTaxValue = (tax: Tax) => {
  const value = Number(tax.value ?? 0);
  if (tax.isRate) return `${value}%`;
  return `${value.toFixed(3)} ${tax.currency?.symbol || 'DT'}`;
};

const statusClassName = (active?: boolean) =>
  active
    ? 'border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90'
    : 'border-border bg-muted text-muted-foreground hover:bg-muted';

const TaxPortal: React.FC<TaxPortalProps> = ({ className }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes } = useBreadcrumb();
  const taxManager = useTaxManager();
  const [createMode, setCreateMode] = React.useState<TaxCreateMode>('custom');

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tCommon('submenu.system') },
      { title: tSettings('tax.singular') }
    ]);
  }, [router.locale, setRoutes, tCommon, tSettings]);

  const {
    data: taxes = [],
    isPending: isFetchPending,
    error
  } = useQuery({
    queryKey: ['taxes', 'settings'],
    queryFn: () => api.tax.find()
  });

  const sortedTaxes = React.useMemo(() => [...taxes].sort(sortTaxesForDisplay), [taxes]);
  const vatTaxes = React.useMemo(() => sortedTaxes.filter(isVatTax), [sortedTaxes]);
  const customTaxes = React.useMemo(
    () => sortedTaxes.filter((tax) => !isVatTax(tax)),
    [sortedTaxes]
  );

  const invalidateTaxes = async () => {
    await queryClient.invalidateQueries({ queryKey: ['taxes'] });
  };

  const { mutate: createTax, isPending: isCreatePending } = useMutation({
    mutationFn: (data: Tax) => api.tax.create(data),
    onSuccess: async () => {
      toast.success(tSettings('tax.messages.create_success'));
      taxManager.reset();
      await invalidateTaxes();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('', mutationError, tSettings('tax.messages.create_error')));
    }
  });

  const { mutate: updateTax, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: Tax) => api.tax.update(data),
    onSuccess: async () => {
      toast.success(tSettings('tax.messages.update_success'));
      taxManager.reset();
      await invalidateTaxes();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('', mutationError, tSettings('tax.messages.update_error')));
    }
  });

  const { mutate: removeTax, isPending: isDeletePending } = useMutation({
    mutationFn: (id?: number) => api.tax.remove(id),
    onSuccess: async () => {
      toast.success(tSettings('tax.messages.delete_success'));
      taxManager.reset();
      closeDeleteTaxDialog();
      await invalidateTaxes();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('', mutationError, tSettings('tax.messages.delete_error')));
    }
  });

  const normalizeCustomTaxForSubmit = (tax: Partial<Tax>): Partial<Tax> => {
    const value = Number(tax.value);
    const isRate = tax.isRate !== false;

    return {
      ...tax,
      label: tax.label?.trim(),
      value: Number.isFinite(value) ? value : undefined,
      isRate,
      isSpecial: Boolean(tax.isSpecial),
      currencyId: !isRate && taxManager.specificCurrency ? tax.currencyId ?? null : null
    };
  };

  const getTaxValidationMessage = (
    tax: Partial<Tax>,
    options: { isVat?: boolean; requireCurrency?: boolean } = {}
  ) => {
    const label = tax.label?.trim() || '';
    const value = Number(tax.value);

    if (!options.isVat && label.length < 3) {
      return tSettings('tax.validation.label_required');
    }

    if (!Number.isFinite(value)) {
      return tSettings('tax.validation.value_required');
    }

    if (tax.isRate !== false && (value < 0 || value > 99)) {
      return tSettings('tax.validation.rate_range');
    }

    if (tax.isRate === false && value <= 0) {
      return tSettings('tax.validation.value_positive');
    }

    if (options.requireCurrency && !tax.currencyId) {
      return tSettings('tax.validation.currency_required');
    }

    return '';
  };

  const handleTaxCreateSubmit = () => {
    const tax = taxManager.getTax();
    const value = Number(tax.value);

    const taxToCreate =
      createMode === 'vat'
        ? {
            ...tax,
            label: `TVA ${value}%`,
            value,
            isRate: true,
            isSpecial: false,
            currencyId: null
          }
        : normalizeCustomTaxForSubmit(tax);
    const validationMessage = getTaxValidationMessage(taxToCreate, {
      isVat: createMode === 'vat',
      requireCurrency: createMode === 'custom' && taxToCreate.isRate === false && taxManager.specificCurrency
    });

    if (validationMessage) {
      toast.error(validationMessage);
      return false;
    }

    const result = createTaxSchema.safeParse(taxToCreate);
    if (!result.success) {
      taxManager.set('errors', result.error.flatten().fieldErrors);
      return false;
    }

    const { id: _id, ...createPayload } = taxToCreate;
    createTax(
      { ...createPayload, isActive: true },
      {
        onSuccess: () => closeCreateTaxSheet()
      }
    );
    return true;
  };

  const handleTaxUpdateSubmit = () => {
    const tax = normalizeCustomTaxForSubmit(taxManager.getTax());
    const validationMessage = getTaxValidationMessage(tax, {
      requireCurrency: tax.isRate === false && taxManager.specificCurrency
    });

    if (validationMessage) {
      toast.error(validationMessage);
      return false;
    }

    const result = updateTaxSchema.safeParse(tax);
    if (!result.success) {
      taxManager.set('errors', result.error.flatten().fieldErrors);
      return false;
    }

    updateTax(tax, {
      onSuccess: () => closeUpdateTaxSheet()
    });
    return true;
  };

  const { createTaxSheet, openCreateTaxSheet, closeCreateTaxSheet } = useTaxCreateSheet(
    handleTaxCreateSubmit,
    isCreatePending,
    taxManager.reset,
    createMode
  );

  const { updateTaxSheet, openUpdateTaxSheet, closeUpdateTaxSheet } = useTaxUpdateSheet(
    handleTaxUpdateSubmit,
    isUpdatePending,
    !taxManager.isChanged(),
    taxManager.reset
  );

  const { deleteTaxDialog, openDeleteTaxDialog, closeDeleteTaxDialog } = useTaxDeleteDialog(
    taxManager.label,
    () => removeTax(taxManager.id),
    isDeletePending
  );

  const openCreateDialog = (isVat: boolean) => {
    setCreateMode(isVat ? 'vat' : 'custom');
    taxManager.reset();
    taxManager.set('isRate', true);
    taxManager.set('isSpecial', false);
    taxManager.set('value', isVat ? undefined : 0);
    taxManager.set('label', '');
    taxManager.set('currencyId', null);
    taxManager.set('specificCurrency', false);
    openCreateTaxSheet();
  };

  const openUpdateDialog = (tax: Tax) => {
    if (tax.isTemplate) return;
    taxManager.setTax(tax);
    openUpdateTaxSheet();
  };

  const openDeleteDialog = (tax: Tax) => {
    if (tax.isTemplate) return;
    taxManager.setTax(tax);
    openDeleteTaxDialog();
  };

  const toggleActive = (tax: Tax, isActive: boolean) => {
    updateTax({ ...tax, isActive });
  };

  const isPending = isFetchPending || isCreatePending || isUpdatePending || isDeletePending;

  const renderStatus = (tax: Tax) => (
    <div className="flex items-center gap-3">
      <Switch
        checked={tax.isActive ?? false}
        disabled={isUpdatePending}
        onCheckedChange={(checked) => toggleActive(tax, checked)}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
      />
      <Badge className={statusClassName(tax.isActive)}>
        {tax.isActive ? tSettings('tax.status.active') : tSettings('tax.status.inactive')}
      </Badge>
    </div>
  );

  const renderActions = (tax: Tax) => {
    const disabled = Boolean(tax.isTemplate);
    return (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          onClick={() => openUpdateDialog(tax)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-600"
          disabled={disabled}
          onClick={() => openDeleteDialog(tax)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderVatTable = () => (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tSettings('tax.table.rate')}</TableHead>
            <TableHead>{tSettings('tax.table.status')}</TableHead>
            <TableHead className="text-right">{tSettings('tax.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            <TableRow>
              <TableCell colSpan={3} className="h-28 text-center">
                <div className="flex items-center justify-center gap-2 font-medium">
                  {tCommon('table.loading')}
                  <Spinner />
                </div>
              </TableCell>
            </TableRow>
          ) : vatTaxes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-28 text-center text-muted-foreground">
                {tSettings('tax.table.empty_vat')}
              </TableCell>
            </TableRow>
          ) : (
            vatTaxes.map((tax) => (
              <TableRow key={tax.id}>
                <TableCell className="h-12 font-medium">{formatTaxValue(tax)}</TableCell>
                <TableCell>{renderStatus(tax)}</TableCell>
                <TableCell>{renderActions(tax)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderCustomTable = () => (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tSettings('tax.table.name')}</TableHead>
            <TableHead>{tSettings('tax.table.value')}</TableHead>
            <TableHead>{tSettings('tax.table.scope')}</TableHead>
            <TableHead>{tSettings('tax.table.status')}</TableHead>
            <TableHead className="text-right">{tSettings('tax.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            <TableRow>
              <TableCell colSpan={5} className="h-28 text-center">
                <div className="flex items-center justify-center gap-2 font-medium">
                  {tCommon('table.loading')}
                  <Spinner />
                </div>
              </TableCell>
            </TableRow>
          ) : customTaxes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                {tSettings('tax.table.empty_custom')}
              </TableCell>
            </TableRow>
          ) : (
            customTaxes.map((tax) => (
              <TableRow key={tax.id}>
                <TableCell className="h-12 font-medium">{tax.label}</TableCell>
                <TableCell>{formatTaxValue(tax)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {tax.isTemplate
                      ? tSettings('tax.scope.template')
                      : tSettings('tax.scope.private')}
                  </Badge>
                </TableCell>
                <TableCell>{renderStatus(tax)}</TableCell>
                <TableCell>{renderActions(tax)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (error) {
    return tSettings('tax.messages.load_error');
  }

  return (
    <div className={cn('flex flex-1 flex-col overflow-auto px-4 py-5 lg:px-8 lg:py-6', className)}>
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <div className="flex flex-wrap items-start gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg px-4 text-sm font-medium transition-all"
            onClick={() => router.push('/settings')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon('commands.back')}
          </Button>
        </div>

        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
            {tSettings('tax.singular')}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {tSettings('tax.card_description')}
          </p>
        </div>

        <Tabs defaultValue="vat" className="flex flex-col gap-3">
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-none border border-border bg-muted/20 p-0">
            <TabsTrigger value="vat" className="h-full rounded-none">
              {tSettings('tax.tabs.vat')}
            </TabsTrigger>
            <TabsTrigger value="custom" className="h-full rounded-none">
              {tSettings('tax.tabs.custom')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vat" className="mt-0">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold">{tSettings('tax.sections.vat')}</h2>
                <Button
                  className="h-9 rounded-md px-4 font-medium"
                  onClick={() => openCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {tSettings('tax.actions.add_vat')}
                </Button>
              </div>
              {renderVatTable()}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-0">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold">{tSettings('tax.sections.custom')}</h2>
                <Button
                  className="h-9 rounded-md px-4 font-medium"
                  onClick={() => openCreateDialog(false)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {tSettings('tax.actions.add_custom')}
                </Button>
              </div>
              {renderCustomTable()}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {createTaxSheet}
      {updateTaxSheet}
      {deleteTaxDialog}
    </div>
  );
};

export default TaxPortal;

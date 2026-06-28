import { WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDialog } from '@/components/shared/Dialogs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTaxManager } from '../hooks/useTaxManager';
import { CustomTaxForm } from '../CustomTaxForm';

type TaxCreateMode = 'vat' | 'custom';

interface VatCreateFormProps {
  isPending?: boolean;
}

const VatCreateForm = ({ isPending }: VatCreateFormProps) => {
  const { t: tSettings } = useTranslation('settings');
  const taxManager = useTaxManager();
  const value = typeof taxManager.value === 'number' ? String(taxManager.value) : '';

  return (
    <div className="grid gap-2 py-2">
      <Label htmlFor="tax-vat-rate" required>
        {tSettings('tax.vat_form.rate_label')}
      </Label>
      <div className="relative">
        <Input
          id="tax-vat-rate"
          type="number"
          min={0}
          max={99}
          step="0.01"
          inputMode="decimal"
          value={value}
          placeholder={tSettings('tax.vat_form.rate_placeholder')}
          disabled={isPending}
          className="pr-10"
          onChange={(event) => {
            const nextValue = event.target.value;
            taxManager.set('value', nextValue === '' ? undefined : Number(nextValue));
          }}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          %
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{tSettings('tax.vat_form.rate_hint')}</p>
    </div>
  );
};

export const useTaxCreateSheet = (
  createTax?: () => void,
  isCreatePending?: boolean,
  resetTax?: () => void,
  mode: TaxCreateMode = 'custom'
) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const isVatMode = mode === 'vat';
  const {
    DialogFragment: createTaxSheet,
    openDialog: openCreateTaxSheet,
    closeDialog: closeCreateTaxSheet
  } = useDialog({
    title: isVatMode ? (
      tSettings('tax.vat_form.create_title')
    ) : (
      <div className="flex items-center gap-2">
        <WalletCards className="h-5 w-5 text-primary" />
        {tSettings('tax.custom_form.create_title')}
      </div>
    ),
    description: isVatMode
      ? tSettings('tax.vat_form.create_description')
      : tSettings('tax.custom_form.create_description'),
    children: (
      <div className="grid gap-5">
        {isVatMode ? (
          <VatCreateForm isPending={isCreatePending} />
        ) : (
          <CustomTaxForm isPending={isCreatePending} />
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              closeCreateTaxSheet();
            }}
            disabled={isCreatePending}
          >
            {tCommon('commands.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              createTax?.();
            }}
            disabled={isCreatePending}
          >
            {tCommon('commands.create')}
            <Spinner show={isCreatePending} />
          </Button>
        </div>
      </div>
    ),
    className: isVatMode ? 'w-full max-w-[440px]' : 'w-full max-w-[680px]',
    onToggle: resetTax
  });

  return { createTaxSheet, openCreateTaxSheet, closeCreateTaxSheet };
};

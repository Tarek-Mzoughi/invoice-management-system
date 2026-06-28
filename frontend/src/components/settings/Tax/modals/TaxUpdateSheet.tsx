import { WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDialog } from '@/components/shared/Dialogs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { CustomTaxForm } from '../CustomTaxForm';

export const useTaxUpdateSheet = (
  updateTax?: () => void,
  isUpdatePending?: boolean,
  disabled?: boolean,
  resetTax?: () => void
) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const {
    DialogFragment: updateTaxSheet,
    openDialog: openUpdateTaxSheet,
    closeDialog: closeUpdateTaxSheet
  } = useDialog({
    title: (
      <div className="flex items-center gap-2">
        <WalletCards className="h-5 w-5 text-primary" />
        {tSettings('tax.custom_form.update_title')}
      </div>
    ),
    description: tSettings('tax.custom_form.update_description'),
    children: (
      <div className="grid gap-5">
        <CustomTaxForm isPending={isUpdatePending} />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            disabled={isUpdatePending}
            variant="outline"
            onClick={() => {
              closeUpdateTaxSheet();
            }}
          >
            {tCommon('commands.cancel')}
          </Button>
          <Button
            type="button"
            disabled={disabled || isUpdatePending}
            onClick={() => {
              updateTax?.();
            }}
          >
            {tCommon('commands.save')}
            <Spinner show={isUpdatePending} />
          </Button>
        </div>
      </div>
    ),
    className: 'w-full max-w-[680px]',
    onToggle: resetTax
  });

  return { updateTaxSheet, openUpdateTaxSheet, closeUpdateTaxSheet };
};

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { useDialog } from '@/components/shared/Dialogs';

export const useTaxDeleteDialog = (
  taxLabel?: string,
  deleteTax?: () => void,
  isDeletionPending?: boolean
) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const {
    DialogFragment: deleteTaxDialog,
    openDialog: openDeleteTaxDialog,
    closeDialog: closeDeleteTaxDialog
  } = useDialog({
    title: (
      <div className="leading-normal">
        {tSettings('tax.delete_prompt')} <span className="font-light">{taxLabel}</span> ?
      </div>
    ),
    description: tSettings('tax.delete_dialog_description'),
    children: (
      <div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => {
              deleteTax?.();
              closeDeleteTaxDialog();
            }}>
            {tCommon('commands.confirm')}
            <Spinner show={isDeletionPending} />
          </Button>
          <Button
            variant={'secondary'}
            onClick={() => {
              closeDeleteTaxDialog();
            }}>
            {tCommon('commands.cancel')}
          </Button>
        </div>
      </div>
    ),
    className: 'w-[500px]'
  });

  return { deleteTaxDialog, openDeleteTaxDialog, closeDeleteTaxDialog };
};

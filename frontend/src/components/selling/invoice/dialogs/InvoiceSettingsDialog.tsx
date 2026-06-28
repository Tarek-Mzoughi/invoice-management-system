import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';

interface InvoiceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const InvoiceSettingsDialog = ({
  open,
  onOpenChange,
  children
}: InvoiceSettingsDialogProps) => {
  const { t: tCommon } = useTranslation('common');
  const tInvoice = useSellingInvoiceLabels().t;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[760px] gap-0 p-0">
        <DialogHeader className="border-b border-zinc-200 px-6 py-5 pr-12 dark:border-zinc-800">
          <DialogTitle>{tInvoice('settings_dialog.title')}</DialogTitle>
          <DialogDescription>{tInvoice('settings_dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto bg-zinc-50/40 px-6 py-5 dark:bg-zinc-950/40">
          {children}
        </div>

        <DialogFooter className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('commands.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

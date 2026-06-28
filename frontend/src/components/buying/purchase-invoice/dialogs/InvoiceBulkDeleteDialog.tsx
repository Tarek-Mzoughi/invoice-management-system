import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { Label } from '@/components/ui/label';

interface InvoiceBulkDeleteDialogProps {
  className?: string;
  count: number;
  open: boolean;
  onDelete: () => void;
  isPending?: boolean;
  onClose: () => void;
}

export const InvoiceBulkDeleteDialog: React.FC<InvoiceBulkDeleteDialogProps> = ({
  className,
  count,
  open,
  onDelete,
  isPending,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const header = (
    <Label className="leading-5">
      <Trans
        i18nKey="invoice.bulk_remove_confirmation"
        t={tInvoicing}
        values={{ count }}
        components={[<span key="0" />, <span key="1" className="font-semibold text-rose-600" />]}
      />
    </Label>
  );

  const footer = (
    <div className="flex gap-2 mt-2 items-center justify-center">
      <Button
        variant="destructive"
        className="w-1/2 flex gap-2"
        disabled={isPending}
        onClick={onDelete}
      >
        {!isPending && <Check className="h-4 w-4" />}
        {isPending ? <Spinner size="small" /> : tCommon('commands.delete')}
      </Button>
      <Button
        className="w-1/2 flex gap-2"
        variant="secondary"
        disabled={isPending}
        onClick={onClose}
      >
        <X className="h-4 w-4" />
        {tCommon('answer.no')}
      </Button>
    </div>
  );

  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className={cn('w-full sm:max-w-125 p-8', className)}>
          <DialogHeader>
            <DialogTitle>{tCommon('commands.delete_selection')}</DialogTitle>
            <DialogDescription className="flex gap-2 pt-4 items-center px-2">
              {header}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">{footer}</div>
        </DialogContent>
      </Dialog>
    );

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{tCommon('commands.delete_selection')}</DrawerTitle>
          <DrawerDescription className="flex gap-2 pt-4 items-center px-2">
            {header}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="border-t pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

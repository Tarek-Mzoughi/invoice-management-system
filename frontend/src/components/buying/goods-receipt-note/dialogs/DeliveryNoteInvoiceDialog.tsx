import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { Checkbox } from '@/components/ui/checkbox';
import { DELIVERY_NOTE_STATUS } from '@/types';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
interface DeliveryNoteInvoiceDialogProps {
  className?: string;
  id?: number;
  status: DELIVERY_NOTE_STATUS;
  sequential: string;
  open: boolean;
  invoice: (id: number, createInvoice: boolean) => void;
  isInvoicePending?: boolean;
  scope?: 'selling' | 'buying';
  onClose: () => void;
}
export const DeliveryNoteInvoiceDialog: React.FC<DeliveryNoteInvoiceDialogProps> = ({
  className,
  id,
  status,
  sequential,
  open,
  invoice,
  isInvoicePending,
  scope = 'buying',
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const documentLabels = useScopedDocumentLabels('deliveryNote', scope);
  const isDesktop = useMediaQuery('(min-width: 1500px)');
  const [invoiceMark, setInvoiceMark] = React.useState(false);
  const header = (
    <Label className="leading-5">
      Voulez-vous vraiment facturer le {documentLabels.document.toLowerCase()} N°{' '}
      <span className="font-semibold">{sequential}</span> ?
    </Label>
  );
  const content = (
    <span className="flex gap-2 items-center">
      <Checkbox checked={invoiceMark} onCheckedChange={() => setInvoiceMark(!invoiceMark)} />{' '}
      <Label>{tInvoicing('deliveryNote.mark_invoiced')}</Label>
    </span>
  );
  const footer = (
    <div className="flex gap-2 mt-2 items-center justify-center">
      <Button
        className="w-1/2 flex gap-2"
        onClick={() => {
          if (id) invoice(id, status != DELIVERY_NOTE_STATUS.Delivered ? !invoiceMark : true);
          onClose();
        }}
      >
        <Check /> Facturer
        <Spinner className="ml-2" size={'small'} show={isInvoicePending} />
      </Button>
      <Button
        className="w-1/2 flex gap-2"
        variant={'secondary'}
        onClick={() => {
          onClose();
        }}
      >
        <X />
        {tCommon('answer.no')}
      </Button>
    </div>
  );
  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={cn('max-w-[25vw] p-8', className)}>
          <DialogHeader>
            <DialogTitle>{header}</DialogTitle>
            {status != DELIVERY_NOTE_STATUS.Delivered && (
              <DialogDescription className="flex gap-2 pt-4 items-center px-2">
                {content}
              </DialogDescription>
            )}
          </DialogHeader>
          {footer}
        </DialogContent>
      </Dialog>
    );
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{header}</DrawerTitle>
          {status != DELIVERY_NOTE_STATUS.Delivered && (
            <DrawerDescription className="flex gap-2 items-center p-4">{content}</DrawerDescription>
          )}
        </DrawerHeader>
        <DrawerFooter className="border-t pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

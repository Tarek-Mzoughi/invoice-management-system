import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { Info, Receipt } from 'lucide-react';
import { PaymentConditionForm } from '../PaymentConditionForm';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';

interface PaymentConditionCreateDialogProps {
  className?: string;
  id?: number;
  open: boolean;
  createPaymentCondition: () => void;
  isCreatePending?: boolean;
  onClose: () => void;
}

export const PaymentConditionCreateDialog: React.FC<PaymentConditionCreateDialogProps> = ({
  className,
  open,
  createPaymentCondition,
  isCreatePending,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1500px)');

  const title = (
    <>
      <Receipt />
      <Label className="font-semibold">Nouvelle Condition de paiement </Label>
    </>
  );
  const description = (
    <>
      <Info className="h-10 w-10" />
      <Label className="leading-5">
        Introduisez les détails pour créer une nouvelle condition de paiement. Assurez-vous que tous
        les champs obligatoires sont remplis avant
      </Label>
    </>
  );
  const footer = (
    <div className="flex gap-2 mt-2">
      <Button
        onClick={() => {
          createPaymentCondition?.();
        }}>
        {tCommon('commands.save')}
        <Spinner show={isCreatePending} />
      </Button>
      <Button
        variant={'secondary'}
        onClick={() => {
          onClose();
        }}>
        {tCommon('commands.cancel')}
      </Button>
    </div>
  );
  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={cn('max-w-[25vw]', className)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
            <DialogDescription className="flex gap-2 pt-4 items-center px-2">
              {description}
            </DialogDescription>
          </DialogHeader>
          <PaymentConditionForm className="gap-2 px-3" />
          <DialogFooter className="border-t pt-2">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">{title}</DrawerTitle>
          <DrawerDescription className="flex gap-2 py-4 items-center px-2">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <PaymentConditionForm className="gap-2 px-3 pb-5" />
        <DrawerFooter className="border-t pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

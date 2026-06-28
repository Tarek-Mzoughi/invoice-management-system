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
import { Info, WalletCards } from 'lucide-react';
import { TaxWithholdingForm } from '../TaxWithholdingForm';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';

interface TaxWithholdingCreateDialogProps {
  className?: string;
  open: boolean;
  createTaxWithholding: () => void;
  isCreatePending?: boolean;
  onClose: () => void;
}

export const TaxWithholdingCreateDialog: React.FC<TaxWithholdingCreateDialogProps> = ({
  className,
  open,
  createTaxWithholding,
  isCreatePending,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1500px)');

  const title = (
    <>
      <WalletCards />
      <Label className="font-semibold">Nouveau Retenue à la source</Label>
    </>
  );
  const description = (
    <>
      <Info className="h-12 w-12" />
      <Label className="leading-5">
        Introduisez les détails pour créer un nouveau taxe Assurez-vous que tous les champs
        obligatoires sont remplis avant d&apos;enregistrer.
      </Label>
    </>
  );
  const footer = (
    <div className="flex gap-2 mt-2">
      <Button
        onClick={() => {
          createTaxWithholding?.();
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
        <DialogContent className={cn('max-w-[30vw]', className)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
            <DialogDescription className="flex gap-2 pt-4 items-center px-2">
              {description}
            </DialogDescription>
          </DialogHeader>
          <TaxWithholdingForm className="gap-2 px-3 pb-5" />
          <DialogFooter className="border-t pt-2">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className={cn(className)}>
        <div className="px-4">
          <DrawerHeader className="text-left ">
            <DrawerTitle className="flex items-center gap-2">{title}</DrawerTitle>
            <DrawerDescription className="flex gap-2 py-4 items-center px-2">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <TaxWithholdingForm className="gap-2 px-3 pb-5" />
        </div>
        <DrawerFooter className="border-t py-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

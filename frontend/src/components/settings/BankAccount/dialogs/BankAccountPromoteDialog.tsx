import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { Check, X } from 'lucide-react';
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

interface BankAccountPromoteDialogProps {
  className?: string;
  label?: string;
  open: boolean;
  promoteBankAccount: () => void;
  isPromotingPending?: boolean;
  onClose: () => void;
}

export const BankAccountPromoteDialog: React.FC<BankAccountPromoteDialogProps> = ({
  className,
  label,
  open,
  promoteBankAccount,
  isPromotingPending,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  const isDesktop = useMediaQuery('(min-width: 1500px)');

  const header = (
    <Label className="leading-5">
      <Trans
        ns="settings"
        i18nKey="bank_account.promote_prompt"
        components={{ label: <span key="label" className="font-bold" /> }}
        values={{ label }}
      />
    </Label>
  );

  const footer = (
    <div className="flex gap-2 mt-2 items-center justify-center">
      <Button
        className="w-1/2 flex gap-1"
        onClick={() => {
          promoteBankAccount?.();
        }}>
        {tCommon('commands.promote')}
        <Check className="w-5 h-5" />
        <Spinner show={isPromotingPending} />
      </Button>
      <Button
        className="w-1/2 flex gap-1"
        variant={'secondary'}
        onClick={() => {
          onClose();
        }}>
        {tCommon('answer.no')}
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={cn('max-w-[25vw] p-8', className)}>
          <DialogHeader>
            <DialogTitle />
            <DialogDescription className="flex gap-2 pt-4 items-center px-2">
              {header}
            </DialogDescription>
          </DialogHeader>
          {footer}
        </DialogContent>
      </Dialog>
    );
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle />
          <DrawerDescription className="flex gap-2 pt-4 items-center px-2">
            {header}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="border-t pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

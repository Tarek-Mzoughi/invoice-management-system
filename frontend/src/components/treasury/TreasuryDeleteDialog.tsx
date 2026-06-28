import React from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
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
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { cn } from '@/lib/utils';

interface TreasuryDeleteDialogProps {
  className?: string;
  open: boolean;
  title: string;
  description: string;
  contextLabel?: string;
  contextValue?: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const TreasuryDeleteDialog: React.FC<TreasuryDeleteDialogProps> = ({
  className,
  open,
  title,
  description,
  contextLabel,
  contextValue,
  isPending,
  onClose,
  onConfirm
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1500px)');

  const content = (
    <>
      <div className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-xl font-semibold text-red-500">
          <Trash2 className="h-5 w-5" />
          <span>{title}</span>
        </div>
        <p className="pt-3 text-base leading-7 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
        {contextLabel && contextValue ? (
          <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {contextLabel}: {contextValue}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {tCommon('commands.cancel')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="gap-2"
          onClick={onConfirm}
          disabled={isPending}
        >
          <Spinner show={isPending} />
          {tCommon('commands.delete')}
        </Button>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent
          hideCloseButton
          className={cn('max-w-[32rem] gap-0 overflow-hidden p-0', className)}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent className={cn('gap-0 overflow-hidden p-0', className)}>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {content}
        <DrawerFooter className="sr-only" />
      </DrawerContent>
    </Drawer>
  );
};

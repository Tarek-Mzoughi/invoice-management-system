import React from 'react';
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
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { Checkbox } from '@/components/ui/checkbox';

interface GenericDuplicateDialogProps {
  className?: string;
  sequential: string;
  documentLabel: string;
  fileDuplicationLabel: string;
  open: boolean;
  onDuplicate: (includeFiles: boolean) => void;
  isPending?: boolean;
  onClose: () => void;
}

export const GenericDuplicateDialog: React.FC<GenericDuplicateDialogProps> = ({
  className,
  sequential,
  documentLabel,
  fileDuplicationLabel,
  open,
  onDuplicate,
  isPending,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [includeFiles, setIncludeFiles] = React.useState(false);

  const header = (
    <Label className="leading-5">
      {tCommon('dialogs.confirmDuplicateMessage', {
        documentLabel,
        sequential,
      })}
    </Label>
  );

  const content = (
    <span className="flex gap-2 items-center">
      <Checkbox checked={includeFiles} onCheckedChange={() => setIncludeFiles(!includeFiles)} />{' '}
      <Label>{fileDuplicationLabel}</Label>
    </span>
  );

  const footer = (
    <div className="flex gap-2 mt-2 items-center justify-center">
      <Button
        className="w-1/2 flex gap-1"
        onClick={() => {
          onDuplicate(includeFiles);
          setIncludeFiles(false);
        }}
      >
        <Check className="h-4 w-4" />
        {tCommon('commands.duplicate')}
        <Spinner size={'small'} show={isPending} />
      </Button>
      <Button
        className="w-1/2 flex gap-1"
        variant={'secondary'}
        onClick={() => {
          onClose();
        }}
      >
        <X className="h-4 w-4" /> {tCommon('commands.cancel')}
      </Button>
    </div>
  );

  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={cn('w-full sm:max-w-125 py-5 px-4', className)}>
          <DialogHeader className="text-left">
            <DialogTitle>{header}</DialogTitle>
            <DialogDescription className="flex gap-2 pt-4 items-center px-2">
              {content}
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
          <DrawerTitle>{header}</DrawerTitle>
          <DrawerDescription className="flex gap-2 items-center p-4">{content}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="border-t pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

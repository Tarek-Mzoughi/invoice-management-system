import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Spinner } from '@/components/shared';
import { Label } from '@/components/ui/label';
import { File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';

interface GenericDownloadDialogProps {
  className?: string;
  open: boolean;
  onDownload: (template: string) => void;
  isPending: boolean;
  onClose: () => void;
  templates?: { key: string; label: string }[];
}

const DEFAULT_TEMPLATES = [
  { key: 'template1', label: 'Template 1' },
  { key: 'template2', label: 'Template 2' },
  { key: 'template3', label: 'Template 3' }
];

export const GenericDownloadDialog: React.FC<GenericDownloadDialogProps> = ({
  className,
  open,
  onDownload,
  isPending,
  onClose,
  templates = DEFAULT_TEMPLATES
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const body = (
    <div className={cn(className, 'grid grid-cols-2 gap-4')}>
      {templates.map((template) => (
        <div
          key={template.key}
          className="flex gap-2 items-center cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-500 rounded-lg p-4"
          onClick={() => onDownload(template.key)}
        >
          <File />
          <Label className="cursor-pointer">{template.label}</Label>
          <Spinner className="ml-2" size={'small'} show={isPending} />
        </div>
      ))}
    </div>
  );

  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={cn('w-full sm:max-w-125 p-8', className)}>
          <DialogHeader>
            <DialogTitle>{tCommon('commands.download_title')}</DialogTitle>
            <DialogDescription>{tCommon('commands.download_description')}</DialogDescription>
          </DialogHeader>
          <div>{body}</div>
        </DialogContent>
      </Dialog>
    );

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{tCommon('commands.download_title')}</DrawerTitle>
          <DrawerDescription>{tCommon('commands.download_description')}</DrawerDescription>
        </DrawerHeader>
        <div>{body}</div>
        <DrawerFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>
            {tCommon('commands.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

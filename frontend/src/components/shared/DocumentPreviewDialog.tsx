import React from 'react';
import { Download, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { cn } from '@/lib/utils';

interface DocumentPreviewDialogProps {
  className?: string;
  closeLabel?: string;
  downloadLabel?: string;
  open: boolean;
  loading: boolean;
  previewBlob: Blob | null;
  filename: string;
  printLabel?: string;
  title?: string;
  onClose: () => void;
}

export const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  className,
  closeLabel,
  downloadLabel,
  open,
  loading,
  previewBlob,
  filename,
  printLabel,
  title,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !previewBlob) {
      setObjectUrl((currentUrl) => {
        if (currentUrl) {
          window.URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
      return;
    }

    const nextObjectUrl = window.URL.createObjectURL(previewBlob);
    setObjectUrl((currentUrl) => {
      if (currentUrl) {
        window.URL.revokeObjectURL(currentUrl);
      }
      return nextObjectUrl;
    });

    return () => {
      window.URL.revokeObjectURL(nextObjectUrl);
    };
  }, [open, previewBlob]);

  const iframeSrc = objectUrl
    ? `${objectUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit`
    : undefined;

  const handleDownload = () => {
    if (!objectUrl) return;

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
      return;
    }

    if (objectUrl) {
      const popup = window.open(objectUrl, '_blank');
      popup?.focus();
      popup?.print();
    }
  };

  const previewPanel = (
    <div className="flex h-full min-h-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100/80 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {loading ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Spinner size="large" />
          <span>{tCommon('preview_dialog.loading')}</span>
        </div>
      ) : objectUrl ? (
        <iframe
          ref={iframeRef}
          className="block h-full min-h-full w-full max-w-[980px] rounded-sm border-0 bg-white shadow-md shadow-zinc-200/70 dark:shadow-black/20"
          src={iframeSrc}
          title={title || tCommon('commands.preview')}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
          {tCommon('preview_dialog.empty')}
        </div>
      )}
    </div>
  );

  const actions = (
    <>
      <Button variant="outline" size="sm" onClick={onClose}>
        {closeLabel || tCommon('commands.close')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={!objectUrl || loading}>
        <Download className="h-4 w-4" />
        {downloadLabel || tCommon('commands.download')}
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={!objectUrl || loading}>
        <Printer className="h-4 w-4" />
        {printLabel || tCommon('commands.print')}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent
          aria-describedby={undefined}
          className={cn(
            'flex h-[90vh] w-[min(92vw,1280px)] max-w-none flex-col gap-0 overflow-hidden rounded-md p-0',
            className
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <DialogHeader className="space-y-0 text-left">
              <DialogTitle className="text-lg">{title || tCommon('commands.preview')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap items-center gap-2 pr-8">{actions}</div>
          </div>
          <div className="min-h-0 flex-1 bg-white p-6 dark:bg-zinc-950">{previewPanel}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className={cn('max-h-[92vh]', className)}>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title || tCommon('commands.preview')}</DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 px-4 pb-4">
          <div className="h-[68vh]">{previewPanel}</div>
        </div>
        <DrawerFooter className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {actions}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

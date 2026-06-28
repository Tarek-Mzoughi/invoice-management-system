import React from 'react';
import { DownloadIcon, Icon, IconNode, PictureInPicture, Shrink } from 'lucide-react';
import { Label } from './label';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from './drawer';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useTranslation } from 'react-i18next';

interface PreviewDialogProps {
  className?: string;
  open: boolean;
  icon?: React.ReactNode;
  alt?: string;
  preview: string | ArrayBuffer | null;
  onClose: () => void;
}
interface ZoomProps {
  x: number;
  y: number;
  scale: number;
}

export const PreviewDialog: React.FC<PreviewDialogProps> = ({
  className,
  open,
  icon,
  alt,
  preview,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1500px)');
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const onUpdate = React.useCallback(({ x, y, scale }: ZoomProps) => {
    const { current: img } = imgRef;

    if (img) {
      const value = make3dTransformValue({ x, y, scale });
      img.style.setProperty('transform', value);
    }
  }, []);

  const shrink = () => {
    const { current: img } = imgRef;
    if (img) {
      img.style.removeProperty('transform');
    }
  };

  const handleDownload = () => {
    if (typeof preview === 'string') {
      const link = document.createElement('a');
      link.href = preview;
      link.download = alt || 'image.png';
      link.click();
    }
  };

  const handleClose = () => {
    shrink();
    onClose();
  };

  const title = (
    <>
      {icon}
      <Label className="font-semibold">{alt}</Label>
    </>
  );

  const content = (
    <>
      <div className="border-2 p-1 mx-auto">
        <QuickPinchZoom onUpdate={onUpdate}>
          <Image
            ref={imgRef}
            src={preview as string}
            alt={alt || ''}
            width={'500'}
            height={'500'}
            className="transform-origin-center"
          />
        </QuickPinchZoom>
      </div>

      <div className={cn('flex gap-5', isDesktop ? 'my-2 justify-between' : 'my-5 justify-center')}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Shrink className="cursor-pointer" onClick={shrink} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{tCommon('commands.shrink')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DownloadIcon className="cursor-pointer" onClick={handleDownload} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{tCommon('commands.download')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );

  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={cn('w-[50vh]', className)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );

  return (
    <Drawer open={open} onClose={handleClose}>
      <DrawerContent className={cn('overflow-hidden', className)}>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">{title}</DrawerTitle>
          <DrawerDescription />
        </DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
};

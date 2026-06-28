import React, { useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconNode, ImagePlus, ListX, Telescope, X } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from './button';
import { useDebounce } from '@/hooks/other/useDebounce';
import { PreviewDialog } from './image-preview-dialog';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface ImageUploaderProps {
  className?: string;
  value?: File;
  onChange?: (value?: File) => void;
  width?: `${number}`;
  height?: `${number}`;
  alt?: string;
  icon?: React.ReactNode;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  className,
  value,
  onChange,
  width,
  height,
  alt,
  icon
}) => {
  const { t: tCommon } = useTranslation('common');
  const [preview, setPreview] = React.useState<string | ArrayBuffer | null>();
  const { value: debouncedPreview, loading: previewing } = useDebounce<
    string | ArrayBuffer | null | undefined
  >(preview, 500);

  const [viewDialog, setViewDialog] = React.useState(false);

  const createPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (value) {
      createPreview(value);
    }
  }, [value]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        createPreview(file);
        onChange?.(file);
      } else {
        onChange?.(undefined);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 1000000,
    accept: { 'image/png': [] }
  });

  return (
    <div className="flex flex-row gap-2 border-2 rounded-lg">
      <PreviewDialog
        open={viewDialog}
        alt={alt}
        icon={icon}
        preview={debouncedPreview || ''}
        onClose={() => setViewDialog(false)}
      />
      <div
        {...getRootProps()}
        className={cn(
          className,
          'flex flex-col items-center justify-center rounded-lg p-4 shadow-sm shadow-foreground cursor-pointer gap-2 w-full'
        )}>
        <Label className="italic mb-2 flex items-center gap-2">
          {icon}
          <span>{alt}</span>
        </Label>

        {debouncedPreview ? (
          <div className="flex flex-col gap-4 items-center w-full h-32">
            <Image
              src={debouncedPreview as string}
              alt={alt || ''}
              className="rounded-lg my-auto"
              width={width || '128'}
              height={height || '128'}
            />
          </div>
        ) : (
          !debouncedPreview && <ImagePlus className="size-32" />
        )}
        <Input {...getInputProps()} type="file" />
        <Label className="text-center">
          {isDragActive ? tCommon('files.drop_image') : tCommon('files.select_image')}
        </Label>
      </div>
      <div className="flex flex-col items-end w-1/4 h-full">
        <div className="flex flex-col items-center justify-center h-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                asChild
                disabled={!preview}
                className="h-full w-full"
                onClick={() => {
                  setViewDialog(true);
                }}>
                <Button disabled={!preview} className="h-full" variant={'ghost'}>
                  <Telescope />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="center" side="top">
                <p>{tCommon('commands.inspect')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                asChild
                disabled={!preview}
                className="h-full w-full"
                onClick={() => {
                  onDrop([]);
                  setPreview(null);
                }}>
                <Button disabled={!preview} className="h-full" variant={'ghost'}>
                  <X />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="center" side="bottom">
                <p>{tCommon('commands.reset')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

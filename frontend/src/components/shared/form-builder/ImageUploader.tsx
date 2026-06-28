import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import React from 'react';

interface ImageUploaderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  wrapperClassName?: string;
  image?: File | string | null;
  fallback?: string;
  accept?: string;
  progress?: number;
  disabled?: boolean;
  onFileChange?: (e: File) => void;
  onUpload?: (file: File, onProgress: (percent: number) => void) => void;
}

export const ImageUploader = ({
  className,
  wrapperClassName,
  fallback,
  image,
  accept,
  progress,
  disabled,
  onFileChange,
  onUpload,
  ...props
}: ImageUploaderProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={cn(wrapperClassName)}>
      <input
        {...props}
        type="file"
        accept={accept || 'image/*'}
        className="hidden"
        ref={fileInputRef}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileChange?.(file);
            if (onUpload) {
              onUpload(file, (currentProgress: number) => {
                progress = currentProgress;
              });
            }
          }
        }}
      />
      <Avatar
        className={cn(
          'w-24 h-24 cursor-pointer hover:opacity-80 transition',
          disabled && 'opacity-40 pointer-events-none',
          className
        )}
        onClick={() => fileInputRef.current?.click()}>
        <AvatarImage
          src={image ? (typeof image === 'string' ? image : URL.createObjectURL(image)) : undefined}
        />
        <AvatarFallback>{fallback || '?'}</AvatarFallback>
      </Avatar>
    </div>
  );
};

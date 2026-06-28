import React from 'react';
import { ImagePlus, UserRound, X } from 'lucide-react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { PreviewDialog } from '@/components/ui/image-preview-dialog';
import { useUserStore } from '@/hooks/stores/useUserStore';
import { useUploadPreviewUrl } from '@/hooks/use-upload-preview-url';
import { cn } from '@/lib/utils';
import { ProfileSection } from '../ProfileSection';

interface ProfilePictureProps {
  className?: string;
  fallback?: string;
  isPending?: boolean;
  pictureId?: number;
  pictureSlug?: string;
}

export const ProfilePicture = ({
  className,
  fallback,
  isPending,
  pictureId,
  pictureSlug
}: ProfilePictureProps) => {
  const userStore = useUserStore();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const pictureFile = userStore.picture;
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const [viewDialog, setViewDialog] = React.useState(false);
  const remotePreview = useUploadPreviewUrl({ id: pictureId, slug: pictureSlug });

  React.useEffect(() => {
    if (!pictureFile) {
      setLocalPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLocalPreview(reader.result as string);
    reader.readAsDataURL(pictureFile);
  }, [pictureFile]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        userStore.set('picture', acceptedFiles[0]);
      }
    },
    [userStore]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 2_000_000,
    accept: { 'image/png': [], 'image/jpeg': [], 'image/jpg': [], 'image/webp': [] },
    disabled: isPending
  });

  const preview = localPreview || remotePreview;

  return (
    <ProfileSection
      className={cn(className)}
      icon={UserRound}
      title={tSettings('profile.picture')}
      description={tSettings('profile.picture_description')}
      contentClassName="flex flex-col items-center gap-4"
    >
      <PreviewDialog
        open={viewDialog}
        alt={tSettings('profile.picture')}
        icon={<UserRound className="size-4" />}
        preview={preview || ''}
        onClose={() => setViewDialog(false)}
      />

      {preview ? (
        <div className="relative">
          <button type="button" onClick={() => setViewDialog(true)}>
            <Image
              src={preview}
              alt={tSettings('profile.picture')}
              width={128}
              height={128}
              unoptimized
              className="size-32 rounded-full border-4 border-white object-cover shadow-sm ring-1 ring-zinc-200 transition-opacity hover:opacity-90 dark:border-zinc-950 dark:ring-zinc-800"
            />
          </button>
          {localPreview && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -right-2 -top-2 size-6 rounded-full"
              onClick={() => userStore.set('picture', undefined)}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex size-32 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 ring-1 ring-white dark:border-zinc-700 dark:bg-zinc-900 dark:ring-zinc-950">
          {fallback ? (
            <span className="text-3xl font-semibold text-zinc-600 dark:text-zinc-300">
              {fallback}
            </span>
          ) : (
            <UserRound className="size-14 text-muted-foreground" />
          )}
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-4 text-center transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-zinc-300 bg-zinc-50/60 hover:border-primary/60 dark:border-zinc-700 dark:bg-zinc-900/60',
          isPending && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <span className="flex size-9 items-center justify-center rounded-md bg-white text-zinc-600 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-800">
          <ImagePlus className="size-4" />
        </span>
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
          {isDragActive ? tCommon('files.drop_image') : tCommon('files.select_image')}
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP - max 2MB</p>
      </div>
    </ProfileSection>
  );
};

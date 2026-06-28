import React from 'react';
import { Button } from '@/components/ui/button';
import { X, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '../../ui/separator';
import { ImageFile } from './types';

interface ImageUploadManagerProps {
  className?: string;
  wrapperClassName?: string;
  images: ImageFile[];
  onFilesChange?: (e: ImageFile[]) => void;
  onUpload?: (file: File, onProgress: (percent: number) => void) => void;
}

export function ImageUploaderManager({
  className,
  wrapperClassName,
  images,
  onFilesChange,
  onUpload,
  ...props
}: ImageUploadManagerProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        image: file,
        url: URL.createObjectURL(file),
        name: file.name,
        progress: 0
      }));

    const allImages = [...images, ...newImages];
    onFilesChange?.(allImages);

    if (onUpload) {
      newImages.forEach((img) => {
        if (!img.image) return;
        onUpload(img.image, (currentProgress: number) => {
          img.progress = currentProgress;
        });
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeImage = (id: string) => {
    onFilesChange?.(images.filter((img) => img.id !== id));
  };

  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    const targetImage = newImages[dropIndex];

    // Swap the two images
    newImages[draggedIndex] = targetImage;
    newImages[dropIndex] = draggedImage;

    onFilesChange?.(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={cn('flex flex-col gap-2 my-2', className)} {...props}>
      <div className="">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            className="aspect-square relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-background to-muted/30 hover:border-primary/60 hover:scale-105"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <Plus className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">Add Photo</p>
              <p className="text-xs text-muted-foreground text-center mt-1">Tap to select</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Existing Images */}
          {images?.map((imageObj, index) => (
            <div
              key={imageObj.id}
              draggable
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragLeave={handleImageDragLeave}
              onDrop={(e) => handleImageDrop(e, index)}
              onDragEnd={handleImageDragEnd}
              className={cn(
                'relative group cursor-move rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl',
                'border-2 bg-background shadow-lg',
                draggedIndex === index && 'opacity-50 scale-95 rotate-3',
                dragOverIndex === index &&
                  draggedIndex !== index &&
                  'border-primary scale-105 shadow-2xl ring-4 ring-primary/20',
                dragOverIndex !== index && 'border-border hover:border-primary/50'
              )}>
              <div
                className={cn(
                  'aspect-square relative overflow-hidden',
                  imageObj.progress != 100 && 'opacity-50'
                )}>
                <Image
                  src={imageObj.url as string}
                  alt={imageObj.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  fill
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                {/* Drag Handle */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/80">
                  <GripVertical className="h-4 w-4 text-white" />
                </div>

                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(imageObj.id);
                  }}>
                  <X className="h-4 w-4" />
                </Button>

                {/* Image Name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-sm font-medium truncate">{imageObj.name}</p>
                </div>

                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                  {index + 2}
                </div>
              </div>
            </div>
          ))}
        </div>

        {images?.length > 0 && (
          <React.Fragment>
            <Separator className="my-4" />
            <div className="flex items-center justify-between border-border">
              <div>
                <p className="text-muted-foreground text-xs">
                  {images.length} photo{images.length !== 1 ? 's' : ''} • Drag to reorder
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onFilesChange?.([])}
                  disabled={images.length === 0}>
                  Clear All
                </Button>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

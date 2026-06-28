import React, { FC, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Grip, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
}

interface SortableLinkCardProps {
  id: Item;
  className?: string;
  onDelete?: (id: string) => void;
  showHandle?: boolean;
  deleteButtonClassName?: string;
  handleButtonClassName?: string;
  children?: ReactNode;
}

const SortableLinks: FC<SortableLinkCardProps> = ({
  id,
  className,
  onDelete,
  showHandle = true,
  deleteButtonClassName,
  handleButtonClassName,
  children
}) => {
  const uniqueId = id.id;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: uniqueId,
    resizeObserverConfig: { disabled: false },
    transition: { easing: 'cubic-bezier(0.4, 0, 0.2, 1)', duration: 200 }
  });

  const style = {
    transform: CSS.Transform.toString(transform)
  };

  const handleButtonClick = () => {
    onDelete?.(uniqueId);
  };

  const isCursorGrabbing = attributes['aria-pressed'];

  return (
    <div ref={setNodeRef} style={style} key={uniqueId}>
      <Card className={cn('p-3 relative flex justify-between gap-2 group', className)}>
        <div className="w-full">{children}</div>
        {(onDelete || showHandle) && (
          <div className="flex flex-col items-center">
            {onDelete && (
              <button
                className={cn(showHandle ? 'mb-auto' : 'my-auto', deleteButtonClassName)}
                onClick={handleButtonClick}
              >
                <X className="hover:text-red-400 h-5 w-5" />
              </button>
            )}
            {showHandle && (
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  onDelete ? 'mt-auto' : 'my-auto',
                  ` ${isCursorGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`,
                  handleButtonClassName
                )}
                aria-describedby={`DndContext-${uniqueId}`}
              >
                <Grip className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SortableLinks;

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface IconWithBadgeProps {
  icon: LucideIcon;
  iconClassName?: string;
  text: string | number;
  position?: Position;
  className?: string;
  onClick?: () => void;
}

const positionClasses: Record<Position, string> = {
  'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
  'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
  'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2'
};

export function IconWithBadge({
  icon: Icon,
  iconClassName,
  text,
  position = 'top-right',
  className,
  onClick
}: IconWithBadgeProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        onClick ? 'cursor-pointer' : '',
        className
      )}
      onClick={onClick}>
      <Icon className={cn('text-black dark:text-white', iconClassName)} />
      <span
        className={cn(
          'absolute flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full',
          positionClasses[position]
        )}>
        {text}
      </span>
    </div>
  );
}

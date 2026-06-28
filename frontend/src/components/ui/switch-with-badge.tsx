import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from './switch';

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface SwitchWithBadgeProps {
  className?: string;
  badgeClassName?: string;
  text?: string | number;
  position?: Position;
  noBadge?: boolean;
  onClick?: () => void;
  defaultChecked?: boolean;
}

const positionClasses: Record<Position, string> = {
  'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
  'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
  'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2'
};

export function SwitchWithBadge({
  className,
  badgeClassName,
  position = 'top-right',
  noBadge = false,
  text,
  onClick,
  defaultChecked
}: SwitchWithBadgeProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        onClick ? 'cursor-pointer' : '',
        className
      )}>
      <Switch defaultChecked={defaultChecked} onClick={onClick} />
      {!noBadge && (
        <span
          className={cn(
            'absolute flex items-center justify-center min-w-[1.25rem] h-5 px-2 text-xs font-bold text-white bg-red-500 rounded-full',
            positionClasses[position],
            badgeClassName
          )}>
          {text}
        </span>
      )}
    </div>
  );
}

import { Calendar } from 'lucide-react';
import { Label } from '../label';
import { transformDate, transformDate2 } from '@/utils/date.utils';
import { cn } from '@/lib/utils';

interface UneditableCalendarDayPickerProps {
  className?: string;
  value?: Date;
}

export const UneditableCalendarDayPicker = ({
  className,
  value
}: UneditableCalendarDayPickerProps) => {
  return (
    <Label
      className={cn(
        'w-full text-sm mt-2 mb-0 text-center ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-md p-1.5 flex items-center justify-center gap-2',
        className
      )}>
      <Calendar className="h-4 w-4" />
      {transformDate2(value?.toISOString() || '')}
    </Label>
  );
};

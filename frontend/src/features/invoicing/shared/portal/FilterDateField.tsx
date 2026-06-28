import React from 'react';
import { format, parseISO, type Locale } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  fieldClassName,
  labelClassName,
  textClassName,
  mutedTextClassName
} from './portal-constants';

interface FilterDateFieldProps {
  label: string;
  locale: Locale;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

export function FilterDateField({
  label,
  locale,
  onChange,
  placeholder,
  value
}: FilterDateFieldProps) {
  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-2">
      <p className={labelClassName}>{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-3 px-3 text-left text-sm transition hover:border-zinc-300 dark:hover:border-zinc-700',
              fieldClassName,
              !value ? 'text-zinc-400 dark:text-zinc-500' : textClassName
            )}
          >
            <Calendar className={cn('h-4 w-4', mutedTextClassName)} />
            <span className="truncate">
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale }) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker
            locale={locale}
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              onChange(date ? format(date, 'yyyy-MM-dd') : '');
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

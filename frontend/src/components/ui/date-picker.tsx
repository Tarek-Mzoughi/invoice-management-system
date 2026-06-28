import * as React from 'react';
import {
  eachMonthOfInterval,
  endOfYear,
  format,
  getMonth,
  getYear,
  Locale,
  setMonth,
  setYear,
  startOfYear
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Skeleton } from './skeleton';

function getLocalizedMonths(locale: Locale) {
  const months = eachMonthOfInterval({
    start: startOfYear(new Date()),
    end: endOfYear(new Date())
  });

  return months.map((month) => format(month, 'LLLL', { locale }));
}

interface DatePickerProps {
  className?: string;
  containerClassName?: string;
  value?: Date;
  onChange: (value: Date) => void;
  startYear?: number;
  endYear?: number;
  placeholder?: string;
  isPending?: boolean;
  disabled?: boolean;
}
export function DatePicker({
  className,
  containerClassName,
  value,
  onChange,
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
  placeholder,
  isPending,
  disabled
}: DatePickerProps) {
  const { i18n, t } = useTranslation('common');

  const months = React.useMemo(() => {
    return getLocalizedMonths(i18n.language == 'fr' ? fr : enUS);
  }, [i18n.language]);

  const date = React.useMemo(() => {
    return value;
  }, [value, i18n.language]);

  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  const handleMonthChange = (month: string) => {
    if (date) {
      const newDate = setMonth(date, months.indexOf(month));
      onChange(newDate);
    }
  };

  const handleYearChange = (year: string) => {
    if (date) {
      const newDate = setYear(date, parseInt(year));
      onChange(newDate);
    }
  };

  const handleSelect = (selectedData: Date | undefined) => {
    if (selectedData) {
      onChange(selectedData);
    }
  };
  if (isPending) return <Skeleton className={cn('h-9', className)} />;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'default'}
          disabled={disabled}
          className={cn(
            'flex gap-2 justify-center items-center',
            !value && 'text-muted-foreground',
            className
          )}>
          <CalendarIcon className="h-4 w-4 text-white dark:text-black" />
          <span className="text-white dark:text-black">
            {date
              ? format(date, 'PPP', { locale: i18n.language == 'fr' ? fr : enUS })
              : placeholder || t('pick_date')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-auto p-2', containerClassName)}>
        <div className="flex justify-between p-2">
          <Select onValueChange={handleMonthChange} value={months[getMonth(date || new Date())]}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={handleYearChange} value={getYear(date || new Date()).toString()}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          month={date}
          onMonthChange={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}

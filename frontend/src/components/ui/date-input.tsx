import React from 'react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { Calendar, CalendarProps } from './calendar';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputContainerProps?: React.HTMLAttributes<HTMLDivElement>;
  calendarIconClassName?: string;
  onValueChange?: (value: string) => void;
  calendarProps?: CalendarProps;
  error?: boolean;
  isPending?: boolean;
}

const DatePicker = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      inputContainerProps,
      calendarIconClassName,
      className,
      type,
      onBlur,
      onValueChange,
      value: _value,
      calendarProps,
      error,
      ...props
    },
    ref
  ) => {
    const { locale } = useRouter();

    const [value, setValue] = React.useState(_value as string);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onValueChange && onValueChange(value);
      onBlur && onBlur(e);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    };

    React.useEffect(() => {
      setValue(_value as string);
    }, [_value]);

    const selectedDate = React.useMemo(() => {
      if (!value) {
        return undefined;
      }
      return new Date(value);
    }, [value]);

    const { className: inputContainerClassName, ...restInputContainerProps } =
      inputContainerProps || {};

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            className={cn('w-full relative', inputContainerClassName)}
            {...restInputContainerProps}>
            <Input
              className={cn(
                error &&
                  'border-red-600 focus-visible:ring-0 focus-visible:ring-ring focus-visible:border-red-600 focus-visible:ring-offset-0',
                className
              )}
              onBlur={handleBlur}
              type={type || 'date'}
              onClick={(e) => {
                e.stopPropagation();
              }}
              ref={ref}
              value={value}
              onChange={(e) => {
                onChange(e);
              }}
              {...props}
            />
            <div className="absolute flex right-0.5 top-0.5 bottom-0.5 w-8 rounded-md justify-center items-center z-50">
              <CalendarIcon
                className={cn(
                  'h-4 w-4 cursor-pointer bg-card text-muted-foreground',
                  error && 'text-red-600',
                  calendarIconClassName
                )}
              />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-auto p-0">
          <Calendar
            locale={locale == 'fr' ? fr : enUS}
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            month={selectedDate}
            classNames={{
              caption_dropdowns: 'w-full justify-center items-start flex gap-2 p-2'
            }}
            captionLayout="dropdown-buttons"
            fromYear={1890}
            toYear={2200}
            onMonthChange={(month) => {
              if (month) {
                setValue(format(month, 'yyyy-MM-dd'));
                onValueChange && onValueChange(format(month, 'yyyy-MM-dd'));
              }
            }}
            onDayClick={(day) => {
              if (format(day, 'yyyy-MM-dd') === _value) {
                setValue('');
                onValueChange && onValueChange('');
              }
            }}
            //@ts-ignore
            onSelect={(date) => {
              if (date) {
                setValue(format(date, 'yyyy-MM-dd'));
                onValueChange && onValueChange(format(date, 'yyyy-MM-dd'));
              }
            }}
            initialFocus={true}
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };

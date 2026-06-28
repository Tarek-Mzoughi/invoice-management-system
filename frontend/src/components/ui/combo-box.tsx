import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';

interface ComboboxProps {
  className?: string;
  containerClassName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  data?: { value: string; label: string }[];
  placeholder?: string;
}

export function Combobox({
  className,
  containerClassName,
  value,
  onValueChange,
  data,
  placeholder
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { t: tCommon } = useTranslation('common');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-10', className)}>
          {value
            ? data?.find((d) => {
                return d.value === value;
              })?.label
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0 w-[--radix-popover-trigger-width]', containerClassName)}
        align="start"
        sideOffset={5}>
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{tCommon('table.no_results')}</CommandEmpty>
            <CommandGroup>
              {data?.map((d) => (
                <CommandItem
                  key={d.value}
                  value={d.value}
                  onSelect={(currentValue) => {
                    onValueChange?.(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}>
                  {d.label}
                  <Check
                    className={cn('ml-auto', value === d.value ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

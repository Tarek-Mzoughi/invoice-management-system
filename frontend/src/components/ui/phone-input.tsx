import * as React from 'react';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import * as RPNInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input, InputProps } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from './scroll-area';
import { useTranslation } from 'react-i18next';
import { Skeleton } from './skeleton';

type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
    onChange?: (value: RPNInput.Value) => void;
    isPending?: boolean;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> = React.forwardRef<
  React.ElementRef<typeof RPNInput.default>,
  PhoneInputProps & { isPending?: boolean }
>(({ className, onChange, isPending, ...props }, ref) => {
  return (
    <>
      {!isPending ? (
        <RPNInput.default
          ref={ref}
          className={cn('flex h-11', className)}
          flagComponent={FlagComponent}
          countrySelectComponent={CountrySelect}
          inputComponent={InputComponent}
          //@ts-ignore
          onChange={(value) => onChange?.(value)}
          {...props}
        />
      ) : (
        <Skeleton className="h-11" />
      )}
    </>
  );
});
PhoneInput.displayName = 'PhoneInput';

const InputComponent = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input className={cn('rounded-e-lg rounded-s-none h-full', className)} {...props} ref={ref} />
  )
);
InputComponent.displayName = 'InputComponent';

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
};

const CountrySelect = ({ disabled, value, onChange, options }: CountrySelectProps) => {
  const { t: tCommon } = useTranslation('common');
  const handleSelect = React.useCallback(
    (country: RPNInput.Country) => {
      onChange(country);
    },
    [onChange]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={'outline'}
          className={cn('flex gap-1 rounded-e-none rounded-s-lg h-full px-3 py-0 items-center justify-center')}
          disabled={disabled}>
          <FlagComponent country={value} countryName={value} />
          <ChevronsUpDown
            className={cn('-mr-2 h-4 w-4 opacity-50', disabled ? 'hidden' : 'opacity-100')}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-5" align="start">
        <Command>
          <CommandList>
            <ScrollArea className="h-72">
              <CommandInput placeholder={tCommon('phone-input.search') + '...'} />
              <CommandEmpty>{tCommon('phone-input.not_found')}</CommandEmpty>
              <CommandGroup>
                {options
                  .filter((x) => x.value)
                  .map((option) => (
                    <CommandItem
                      className="gap-2"
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}>
                      <span className="w-1/3 text-start">
                        <FlagComponent country={option.value} countryName={option.label} />
                      </span>
                      <span className="flex-1 text-sm w-1/3 text-center">{option.value}</span>
                      {option.value && (
                        <span className="text-foreground/50 text-sm w-1/3 text-end">
                          {`+${RPNInput.getCountryCallingCode(option.value)}`}
                        </span>
                      )}
                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4',
                          option.value === value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="bg-zinc-100 dark:bg-zinc-800 flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm [&_svg]:h-full [&_svg]:w-full [&_svg]:object-cover">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};
FlagComponent.displayName = 'FlagComponent';

export { PhoneInput };

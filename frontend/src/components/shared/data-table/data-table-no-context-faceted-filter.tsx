import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Box } from 'lucide-react';
import { useDialog } from '../Dialogs';
import { Command } from 'cmdk';
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Option = {
  label: string;
  value: string;
};

interface DataTableEventFilterProps {
  className?: string;
  title?: string;
  options?: Option[];
  selectedValues?: string[];
  onOptionClick?: (selectedOptions: Option[]) => void;
}

export function DataTableNoContextFacetedFilter({
  className,
  title,
  options = [],
  selectedValues = [], // Default to empty array
  onOptionClick
}: DataTableEventFilterProps) {
  const { t: tCommon } = useTranslation('common');
  const [selected, setSelected] = React.useState<Option[]>([]);

  // Sync selected with selectedValues when it changes externally
  useEffect(() => {
    setSelected(options.filter((option) => selectedValues.includes(option.value)));
  }, [selectedValues, options]);

  const toggleSelection = (option: Option) => {
    const updatedSelected = selected.some((opt) => opt.value === option.value)
      ? selected.filter((opt) => opt.value !== option.value)
      : [...selected, option];

    setSelected(updatedSelected);
  };

  const applySelection = () => {
    if (onOptionClick) onOptionClick(selected);
  };

  const resetSelection = () => {
    setSelected([]);
    if (onOptionClick) onOptionClick([]);
  };

  const { DialogFragment, openDialog, closeDialog } = useDialog({
    children: (
      <div className="flex flex-col gap-4">
        <Command>
          <CommandInput placeholder={tCommon('table.filter_placeholder', { entity: title })} />
          <CommandList>
            <CommandEmpty>{tCommon('no_results')}</CommandEmpty>
            <CommandGroup heading={tCommon('suggestions')}>
              {options.map((option) => {
                const isChecked = selected.some((opt) => opt.value === option.value);
                return (
                  <CommandItem
                    key={option.value}
                    className="flex items-center gap-2"
                    onClickCapture={() => {
                      toggleSelection(option);
                    }}>
                    <Checkbox checked={isChecked} />
                    <Label>{option.label}</Label>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex justify-end gap-2">
          <Button
            variant="default"
            onClick={() => {
              applySelection();
              closeDialog();
            }}>
            {tCommon('commands.apply')}
          </Button>
          <Button variant="outline" onClick={resetSelection}>
            {tCommon('commands.reset')}
          </Button>
        </div>
      </div>
    ),
    className: 'w-[400px] h-fit p-2'
  });

  return (
    <div className={cn('flex items-center', className)}>
      <Button className="flex gap-2 h-9" variant="outline" onClick={openDialog}>
        <Box className="w-5 h-5" />
        {title} {selected.length > 0 ? `(${selected.length})` : ''}
      </Button>
      {DialogFragment}
    </div>
  );
}

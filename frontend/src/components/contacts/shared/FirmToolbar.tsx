import React from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FirmTypeFilter } from './firm-table.types';
import {
  firmFieldClassName,
  firmLabelClassName,
  firmMutedTextClassName,
  firmPanelClassName
} from './FirmListLayout';

export interface FirmToolbarProps {
  hasActiveFilters: boolean;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: FirmTypeFilter) => void;
  searchTerm: string;
  typeFilter: FirmTypeFilter;
}

export function FirmToolbar({
  hasActiveFilters,
  onReset,
  onSearchChange,
  onTypeFilterChange,
  searchTerm,
  typeFilter
}: FirmToolbarProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');

  return (
    <section className={cn(firmPanelClassName, 'p-4')}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_220px_auto] lg:items-end">
        <div className="space-y-2">
          <p className={firmLabelClassName}>{tContacts('firm.filters.search')}</p>
          <div className="relative">
            <Search
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                firmMutedTextClassName
              )}
            />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={tContacts('firm.placeholders.search')}
              className={cn(firmFieldClassName, 'pl-10')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className={firmLabelClassName}>{tContacts('firm.filters.type')}</p>
          <Select value={typeFilter} onValueChange={(value: FirmTypeFilter) => onTypeFilterChange(value)}>
            <SelectTrigger className={firmFieldClassName}>
              <SelectValue placeholder={tContacts('firm.filters.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tContacts('firm.filters.all')}</SelectItem>
              <SelectItem value="company">{tContacts('firm.attributes.entreprise_type')}</SelectItem>
              <SelectItem value="person">
                {tContacts('firm.attributes.particular_entreprise_type')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end justify-end">
          {hasActiveFilters && (
            <Button variant="outline" className="h-11 w-full rounded-md px-4 sm:w-auto" onClick={onReset}>
              {tCommon('commands.reset')}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

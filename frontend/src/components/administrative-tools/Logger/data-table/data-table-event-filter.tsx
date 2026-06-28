import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLoggerActions } from './ActionsContext';
import { DataTableNoContextFacetedFilter } from '@/components/shared/data-table/data-table-no-context-faceted-filter';
import { EVENT_TYPE } from '@/types/enums/event-types';

interface DataTableEventFilterProps {
  className?: string;
}

export function DataTableEventFilter({ className }: DataTableEventFilterProps) {
  const { setEvents, events } = useLoggerActions();
  const { t: tLogger } = useTranslation('logger');

  return (
    <DataTableNoContextFacetedFilter
      className={cn(className)}
      title={tLogger('common.attributes.event')}
      options={Object.values(EVENT_TYPE).map((value) => ({
        label: tLogger(`event_names.${value}`),
        value
      }))}
      selectedValues={events}
      onOptionClick={(selectedOptions) => {
        setEvents?.(selectedOptions.map((option) => option.value));
      }}
    />
  );
}

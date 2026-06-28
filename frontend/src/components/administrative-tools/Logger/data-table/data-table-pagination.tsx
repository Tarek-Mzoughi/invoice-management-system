import { DataTableLiveSwitch } from './data-table-live-switch';
import { Button } from '@/components/ui/button';
import { ChevronUpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DataTablePaginationProps {
  scrollTop?: () => void;
}

export function DataTablePagination({ scrollTop }: DataTablePaginationProps) {
  const { t: tLogger } = useTranslation('logger');
  return (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center space-x-2 ">
        <DataTableLiveSwitch scrollTop={scrollTop} />
      </div>
      <div>
        <Button variant="outline" className="flex flex-row gap-2" onClick={() => scrollTop?.()}>
          <ChevronUpIcon className="h-4 w-4" />
          {tLogger('common.scroll_top')}
        </Button>
      </div>
    </div>
  );
}

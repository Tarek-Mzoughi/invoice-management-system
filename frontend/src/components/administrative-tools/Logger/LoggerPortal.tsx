import React from 'react';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import useLogs from '@/components/administrative-tools/Logger/hooks/useLogs';
import { DataTable } from './data-table/data-table';
import { getLogColumns } from './data-table/columns';
import { cn } from '@/lib/utils';
import useSocketLogs from './hooks/useSocketLogs';
import { LoggerActionsContext, LoggerActionsContextProps } from './data-table/ActionsContext';
import { useDebounce } from '@/hooks/other/useDebounce';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoggerPortalProps {
  className?: string;
}

export const LoggerPortal = ({ className }: LoggerPortalProps) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tLogger } = useTranslation('logger');
  const { t: tSettings } = useTranslation('settings');

  const [sortDetails, setSortDetails] = React.useState({
    order: false,
    sortKey: 'id'
  });
  const { value: debouncedSortDetails, loading: sorting } = useDebounce<typeof sortDetails>(
    sortDetails,
    500
  );

  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);

  const [events, setEvents] = React.useState<string[]>([]);

  //http logs
  const { logs, isPending, loadMoreLogs, hasNextPage, refetchLogs } = useLogs(
    debouncedSortDetails.sortKey,
    debouncedSortDetails.order ? 'ASC' : 'DESC',
    startDate,
    endDate,
    events
  );
  //socket logs
  const { logs: socketLogs, toggleConnection, isConnected } = useSocketLogs();

  const [newLogsCount, setNewLogsCount] = React.useState(0);

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tCommon('submenu.logger') }
    ]);
  }, [router.locale, tCommon, setRoutes]);

  const { clearIntro, clearFloating } = useIntro();

  React.useEffect(() => {
    return () => {
      clearIntro?.();
      clearFloating?.();
    };
  }, [clearIntro, clearFloating]);

  const context: LoggerActionsContextProps = {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    events,
    setEvents,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => {
      setSortDetails({ order, sortKey });
    },
    newLogsCount,
    setNewLogsCount,
    toggleConnection: () => {
      toggleConnection();
      refetchLogs();
    },
    isConnected
  };

  return (
    <LoggerActionsContext.Provider value={context}>
      <div className={cn('flex flex-1 flex-col overflow-auto px-4 py-5 lg:px-8 lg:py-6', className)}>
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
          <div className="flex flex-wrap items-start gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg px-4 text-sm font-medium transition-all"
              onClick={() => router.push('/settings')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon('commands.back')}
            </Button>
          </div>

          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
              {tLogger('common.singular')}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {tLogger('common.description')}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold">{tLogger('common.singular')}</h2>
            </div>
            <DataTable
              className="flex flex-col flex-1 overflow-hidden"
              containerClassName="overflow-auto"
              httpLogs={logs}
              socketLogs={socketLogs}
              columns={getLogColumns(tCommon)}
              hasNextPage={hasNextPage}
              loadMoreLogs={loadMoreLogs}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
    </LoggerActionsContext.Provider>
  );
};

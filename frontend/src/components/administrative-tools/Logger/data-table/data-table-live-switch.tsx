import { Label } from '@/components/ui/label';
import { SwitchWithBadge } from '@/components/ui/switch-with-badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLoggerActions } from './ActionsContext';

interface DataTableLiveSwitchProps {
  className?: string;
  scrollTop?: () => void;
}

export const DataTableLiveSwitch = ({ className, scrollTop }: DataTableLiveSwitchProps) => {
  const { t: logger } = useTranslation('logger');
  const { newLogsCount, toggleConnection, isConnected } = useLoggerActions();
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <SwitchWithBadge
        defaultChecked={!newLogsCount}
        text={newLogsCount}
        position="top-right"
        noBadge={!newLogsCount}
        onClick={() => {
          scrollTop?.();
          toggleConnection?.();
        }}
      />
      <Label>
        {logger(
          isConnected
            ? newLogsCount == 0
              ? 'common.no_new_logs'
              : newLogsCount == 1
                ? 'common.one_new_log'
                : 'common.many_new_logs'
            : 'common.live_switch_disconnected',
          { count: newLogsCount }
        )}
      </Label>
    </div>
  );
};

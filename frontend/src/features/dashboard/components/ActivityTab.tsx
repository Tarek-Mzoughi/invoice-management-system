import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardAlerts } from './DashboardAlerts';
import { RecentActivityTable } from './RecentActivityTable';
import {
  DashboardAlert,
  DashboardCurrency,
  DashboardRecentActivity
} from '../types/dashboard.types';

interface ActivityTabProps {
  recentActivity?: DashboardRecentActivity[];
  alerts?: DashboardAlert[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const ActivityTab = ({
  recentActivity,
  alerts,
  currency,
  isLoading,
  isError
}: ActivityTabProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="space-y-6">
      {/* Alerts section */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('activity.alertsSection')}
        </h2>
        <DashboardAlerts
          data={alerts}
          currency={currency}
          isLoading={isLoading}
          isError={isError}
        />
      </section>

      {/* Recent activity section */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('activity.recentSection')}
        </h2>
        <RecentActivityTable
          data={recentActivity}
          currency={currency}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
    </div>
  );
};

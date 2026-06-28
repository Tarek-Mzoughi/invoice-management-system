import Link from 'next/link';
import { Eye, FileText, Receipt, ShoppingCart, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { DashboardCurrency, DashboardRecentActivity } from '../types/dashboard.types';
import { formatDashboardCurrency, formatDashboardDate } from '../utils/dashboard-formatters';

interface RecentActivityTableProps {
  data?: DashboardRecentActivity[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

const activityIcons = {
  invoice: FileText,
  quotation: Receipt,
  payment: WalletCards,
  customerOrder: ShoppingCart
};

export const RecentActivityTable = ({
  data = [],
  currency,
  isLoading,
  isError
}: RecentActivityTableProps) => {
  const { t, i18n } = useTranslation(['dashboard', 'invoicing']);

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">
          {t('activity.title', { ns: 'dashboard' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {t('errors.load', { ns: 'dashboard' })}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {t('empty.activity', { ns: 'dashboard' })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('activity.document', { ns: 'dashboard' })}</TableHead>
                  <TableHead>{t('activity.partner', { ns: 'dashboard' })}</TableHead>
                  <TableHead>{t('activity.status', { ns: 'dashboard' })}</TableHead>
                  <TableHead className="text-right">
                    {t('activity.amount', { ns: 'dashboard' })}
                  </TableHead>
                  <TableHead>{t('activity.date', { ns: 'dashboard' })}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((activity) => {
                  const Icon = activityIcons[activity.type];

                  return (
                    <TableRow key={`${activity.type}-${activity.id}`}>
                      <TableCell>
                        <div className="flex min-w-[160px] items-center gap-2">
                          <Icon className="h-4 w-4 text-zinc-500" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {activity.label || activity.reference || '-'}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {t(`activity.types.${activity.type}`, { ns: 'dashboard' })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[160px]">{activity.partnerName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {activity.status ? t(activity.status, { ns: 'invoicing' }) : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDashboardCurrency(
                          activity.amount,
                          currency,
                          i18n.language === 'fr' ? 'fr-FR' : 'en-US'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDashboardDate(activity.date, i18n.language)}
                      </TableCell>
                      <TableCell>
                        {activity.route ? (
                          <Button asChild variant="ghost" size="icon">
                            <Link
                              href={activity.route}
                              aria-label={t('activity.view', { ns: 'dashboard' })}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

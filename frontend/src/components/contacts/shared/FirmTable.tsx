import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Firm } from '@/types';
import { FirmEmptyState } from './FirmEmptyState';
import {
  firmMutedTextClassName,
  firmPanelClassName,
  firmTextClassName
} from './FirmListLayout';

interface FirmTableProps {
  emptyLabel: string;
  firms: Firm[];
  isPending?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  page: number;
  renderRow: (firm: Firm) => React.ReactNode;
  size: number;
  totalPageCount: number;
  totalResultCount: number;
}

export function FirmTable({
  emptyLabel,
  firms,
  isPending,
  onPageChange,
  onPageSizeChange,
  page,
  renderRow,
  size,
  totalPageCount,
  totalResultCount
}: FirmTableProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');

  return (
    <section className={cn(firmPanelClassName, 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[960px] border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
              <th className="px-4 py-3 font-medium">
                {tContacts('firm.attributes.entreprise_name')}
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                {tContacts('firm.sections.main_contact')}
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                {tContacts('firm.attributes.phone')}
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                {tContacts('firm.attributes.type')}
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                {tContacts('firm.attributes.activity')}
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                {tContacts('firm.attributes.created_at')}
              </th>
              <th className="w-36 whitespace-nowrap px-4 py-3 text-right font-medium">
                {tCommon('commands.actions')}
              </th>
            </tr>
          </thead>

          <tbody>
            {!isPending && firms.length > 0 ? (
              firms.map((firm) => <React.Fragment key={firm.id || firm.createdAt}>{renderRow(firm)}</React.Fragment>)
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <FirmEmptyState
                    label={emptyLabel}
                    loading={isPending}
                    loadingLabel={tCommon('table.loading')}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-zinc-200 px-4 py-4 text-sm dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <span className={firmTextClassName}>{tContacts('firm.pagination.lines')}</span>
            <Select value={String(size)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="h-10 w-[92px] rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className={firmTextClassName}>
            {tContacts('firm.pagination.page')} {page} {tContacts('firm.pagination.of')}{' '}
            {totalPageCount}
          </span>

          <span className={firmMutedTextClassName}>
            {totalResultCount > 0
              ? tContacts(
                  totalResultCount > 1
                    ? 'firm.pagination.results_other'
                    : 'firm.pagination.results_one',
                  { count: totalResultCount }
                )
              : tContacts('firm.pagination.no_results')}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            aria-label={tContacts('firm.pagination.previous_page')}
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md"
            disabled={page <= 1 || isPending}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label={tContacts('firm.pagination.next_page')}
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md"
            disabled={totalPageCount === 0 || page >= totalPageCount || isPending}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

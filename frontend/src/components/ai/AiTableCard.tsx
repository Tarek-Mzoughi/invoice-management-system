import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { AiTablePayload, AiTableColumn } from '@/types/ai';
import { cn } from '@/lib/utils';

interface AiTableCardProps {
  table: AiTablePayload;
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Payée: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  Partielle: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En retard': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Impayée: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Envoyée: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  Brouillon: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Payée',
  partial: 'Partielle',
  overdue: 'En retard',
  unpaid: 'Impayée',
  sent: 'Envoyée',
  draft: 'Brouillon',
};

function formatCellValue(value: unknown, column: AiTableColumn): React.ReactNode {
  if (value === null || value === undefined) return '—';

  switch (column.type) {
    case 'currency': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat('fr-TN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    }
    case 'date': {
      const str = String(value);
      if (!str) return '—';
      try {
        return new Date(str).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } catch {
        return str;
      }
    }
    case 'status': {
      const status = String(value);
      const label = STATUS_LABELS[status] || status;
      const style = STATUS_STYLES[status] || STATUS_STYLES[label] || 'bg-gray-100 text-gray-800';
      return (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', style)}>
          {label}
        </span>
      );
    }
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat('fr-FR').format(num);
    }
    default:
      return String(value);
  }
}

export function AiTableCard({ table }: AiTableCardProps) {
  if (!table.rows.length) {
    return (
      <Card className="w-full">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {table.emptyMessage || 'Aucune donnée disponible.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="text-[11px]">
            <TableHeader>
              <TableRow>
                {table.columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'text-[11px] whitespace-nowrap px-2 py-1.5 h-auto',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row, idx) => (
                <TableRow key={idx}>
                  {table.columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        'text-[11px] whitespace-nowrap px-2 py-1.5',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}>
                      {formatCellValue(row[col.key], col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            {table.totals?.length ? (
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={table.columns.length - 1}
                    className="text-[11px] font-medium text-right px-2 py-1.5">
                    {table.totals[0].label}
                  </TableCell>
                  <TableCell className="text-[11px] font-bold text-right whitespace-nowrap px-2 py-1.5">
                    {new Intl.NumberFormat('fr-TN', {
                      style: 'decimal',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(table.totals[0].value)}
                    {table.totals[0].currency ? ` ${table.totals[0].currency}` : ''}
                  </TableCell>
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

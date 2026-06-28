import React from 'react';
import { AiMessage } from '@/types/ai';
import { AiTableCard } from './AiTableCard';
import { AiKpiCard } from './AiKpiCard';
import { AiChartCard } from './AiChartCard';
import { AiActionConfirmationCard } from './AiActionConfirmationCard';
import { AiInvoiceAnalysisCard } from './AiInvoiceAnalysisCard';
import { cn } from '@/lib/utils';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface AiResponseRendererProps {
  message: AiMessage;
  onConfirmAction?: (actionId: string, overrides?: Record<string, unknown>) => void;
  onCancelAction?: (actionId: string) => void;
  confirmingActions?: Set<string>;
  resolvedActions?: Set<string>;
}

export function AiResponseRenderer({
  message,
  onConfirmAction,
  onCancelAction,
  confirmingActions,
  resolvedActions
}: AiResponseRendererProps) {
  const type = message.type;

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      {/* Text message bubble */}
      {message.content && (
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm bg-muted text-foreground',
            type === 'error' && 'bg-destructive/10 text-destructive',
            type === 'clarification' && 'bg-blue-50 dark:bg-blue-950/30 text-foreground'
          )}>
          <div className="flex items-start gap-2">
            {type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            {type === 'clarification' && <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />}
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {type === 'table' && message.table && (
        <AiTableCard table={message.table} />
      )}

      {/* Chart */}
      {message.chart ? <AiChartCard chart={message.chart} /> : null}

      {/* KPI Summary */}
      {type === 'kpi_summary' && message.kpis && (
        <AiKpiCard kpis={message.kpis} />
      )}

      {/* Action Preview */}
      {type === 'action_preview' && message.action && (
        <AiActionConfirmationCard
          action={message.action}
          onConfirm={onConfirmAction}
          onCancel={onCancelAction}
          isConfirming={confirmingActions?.has(message.action.actionId)}
          isResolved={resolvedActions?.has(message.action.actionId)}
        />
      )}

      {/* Invoice Analysis */}
      {type === 'invoice_analysis' && message.data && message.data.length > 0 ? (
        <AiInvoiceAnalysisCard data={message.data[0] as Record<string, unknown>} />
      ) : null}
    </div>
  );
}

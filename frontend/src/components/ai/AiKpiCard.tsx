import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AiKpi } from '@/types/ai';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiKpiCardProps {
  kpis: AiKpi[];
}

function formatKpiValue(kpi: AiKpi): string {
  if (kpi.currency) {
    return new Intl.NumberFormat('fr-TN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(kpi.value) + ` ${kpi.currency}`;
  }
  return new Intl.NumberFormat('fr-FR').format(kpi.value);
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (!trend) return null;
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function AiKpiCard({ kpis }: AiKpiCardProps) {
  if (!kpis.length) return null;

  return (
    <div className={cn(
      'grid gap-2 w-full',
      kpis.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
    )}>
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="overflow-hidden">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1 truncate">{kpi.label}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold leading-tight">{formatKpiValue(kpi)}</span>
              <TrendIcon trend={kpi.trend} />
            </div>
            {kpi.unit && (
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.unit}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AiChartResponse } from '@/types/ai';
import { AiChartRenderer } from './AiChartRenderer';
import { BarChart3 } from 'lucide-react';

interface AiChartCardProps {
  chart: AiChartResponse;
}

export function AiChartCard({ chart }: AiChartCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {chart.title}
        </CardTitle>
        {chart.description && <CardDescription className="text-xs">{chart.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <AiChartRenderer option={chart.echartsOption} height={320} />

        {chart.insights?.length ? (
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Observations :</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {chart.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface AiChartRendererProps {
  option: Record<string, unknown>;
  height?: number;
  className?: string;
}

function sanitizeOption(option: Record<string, unknown>): Record<string, unknown> {
  // Deep clone and strip any function values for security
  return JSON.parse(JSON.stringify(option, (key, value) => {
    if (typeof value === 'function') return undefined;
    return value;
  }));
}

export function AiChartRenderer({ option, height = 400, className }: AiChartRendererProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const echartsInstance = useRef<any>(null);
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current || !option || Object.keys(option).length === 0) {
      setLoading(false);
      return;
    }

    let disposed = false;

    const initChart = async () => {
      try {
        // Dynamic import of echarts to reduce bundle size
        const echarts = await import('echarts');

        if (disposed || !chartRef.current) return;

        // Dispose previous instance if exists
        if (echartsInstance.current) {
          echartsInstance.current.dispose();
        }

        const isDark = theme === 'dark';
        const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
        echartsInstance.current = chart;

        const safeOption = sanitizeOption(option);

        // Apply dark mode background
        if (isDark) {
          safeOption.backgroundColor = 'transparent';
        }

        chart.setOption(safeOption);
        setLoading(false);
        setError(null);

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          chart.resize();
        });
        resizeObserver.observe(chartRef.current);

        return () => {
          resizeObserver.disconnect();
        };
      } catch (e) {
        if (!disposed) {
          setError('Impossible de charger le graphique.');
          setLoading(false);
        }
      }
    };

    initChart();

    return () => {
      disposed = true;
      if (echartsInstance.current) {
        echartsInstance.current.dispose();
        echartsInstance.current = null;
      }
    };
  }, [option, theme]);

  if (!option || Object.keys(option).length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground',
          className
        )}
        style={{ height }}>
        Aucune donnée disponible pour le graphique.
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 text-sm text-destructive',
          className
        )}
        style={{ height }}>
        {error}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-background/50"
          style={{ height }}>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div ref={chartRef} style={{ height, width: '100%' }} />
    </div>
  );
}

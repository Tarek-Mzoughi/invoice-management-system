import React from 'react';
import { Building2 } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/lib/utils';

interface FirmEmptyStateProps {
  className?: string;
  label: string;
  loading?: boolean;
  loadingLabel: string;
}

export function FirmEmptyState({ className, label, loading, loadingLabel }: FirmEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400',
        className
      )}
    >
      {loading ? (
        <>
          <Spinner />
          <p>{loadingLabel}</p>
        </>
      ) : (
        <>
          <Building2 className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
          <p className="text-base">{label}</p>
        </>
      )}
    </div>
  );
}


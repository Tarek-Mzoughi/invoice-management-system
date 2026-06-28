import React from 'react';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DocumentEditorActionModel } from '@/features/invoicing/shared/models';

export type { DocumentEditorActionModel } from '@/features/invoicing/shared/models';

interface DocumentEditorHeaderProps {
  leading: React.ReactNode;
  actions: React.ReactNode;
  className?: string;
}

interface DocumentEditorActionGroupProps {
  actions: DocumentEditorActionModel[];
}

export const DocumentEditorActionGroup = ({ actions }: DocumentEditorActionGroupProps) => (
  <>
    {actions.map((action) => {
      const Icon = action.icon;

      return (
        <Button
          key={action.id}
          variant={action.variant ?? 'outline'}
          size={action.size ?? 'sm'}
          className={action.className}
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {action.label}
          <Spinner show={action.loading === true} />
        </Button>
      );
    })}
  </>
);

export const DocumentEditorHeader = ({
  leading,
  actions,
  className
}: DocumentEditorHeaderProps) => (
  <div
    className={cn(
      'rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950',
      className
    )}
  >
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">{leading}</div>
      <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
    </div>
  </div>
);

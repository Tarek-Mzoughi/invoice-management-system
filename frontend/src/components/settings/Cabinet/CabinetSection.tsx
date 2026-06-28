import React from 'react';
import { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CabinetSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export const CabinetSection = ({
  title,
  description,
  icon: Icon,
  className,
  contentClassName,
  children
}: CabinetSectionProps) => {
  return (
    <Card
      className={cn(
        'overflow-hidden rounded-xl border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800/80 dark:bg-zinc-950',
        className
      )}
    >
      <CardHeader className="border-b border-zinc-100/80 bg-zinc-50/40 px-5 py-4 dark:border-zinc-900 dark:bg-zinc-900/30">
        <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-normal">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-primary shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <Icon className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-zinc-950 dark:text-zinc-50">{title}</span>
            {description ? (
              <CardDescription className="mt-0.5 text-xs font-normal leading-5 text-zinc-500 dark:text-zinc-400">
                {description}
              </CardDescription>
            ) : null}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('p-5 sm:p-6', contentClassName)}>{children}</CardContent>
    </Card>
  );
};

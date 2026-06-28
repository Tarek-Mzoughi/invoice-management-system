import React from 'react';
import { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export const ProfileSection = ({
  title,
  description,
  icon: Icon,
  className,
  contentClassName,
  children
}: ProfileSectionProps) => {
  return (
    <Card
      className={cn(
        'rounded-lg border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-zinc-800/80 dark:bg-zinc-950',
        className
      )}
    >
      <CardHeader className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-900">
        <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-normal">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <Icon className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate">{title}</span>
            {description && (
              <CardDescription className="mt-1 text-xs font-normal leading-5">
                {description}
              </CardDescription>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('p-5', contentClassName)}>{children}</CardContent>
    </Card>
  );
};

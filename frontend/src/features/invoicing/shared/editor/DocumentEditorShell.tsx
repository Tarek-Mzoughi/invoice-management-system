import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DocumentEditorHeader } from './DocumentEditorHeader';

interface DocumentEditorShellProps {
  toolbarLeading: React.ReactNode;
  toolbarActions: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export const DocumentEditorShell = ({
  toolbarLeading,
  toolbarActions,
  children,
  className,
  contentClassName,
  disabled
}: DocumentEditorShellProps) => (
  <div className={cn('flex flex-col gap-6 pb-8', disabled && 'pointer-events-none', className)}>
    <DocumentEditorHeader leading={toolbarLeading} actions={toolbarActions} />

    <Card className="shadow-sm">
      <CardContent className={cn('space-y-8 p-5 sm:p-6', contentClassName)}>{children}</CardContent>
    </Card>
  </div>
);

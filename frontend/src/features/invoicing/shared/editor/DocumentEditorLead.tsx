import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentEditorLeadProps {
  onBack: () => void;
  backLabel: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const DocumentEditorLead = ({
  onBack,
  backLabel,
  badge,
  className
}: DocumentEditorLeadProps) => (
  <div className={className}>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Button>
      {badge}
    </div>
  </div>
);

import { ArrowLeft, RotateCcw, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PaymentWorkflowHeaderProps {
  backLabel: string;
  onBack: () => void;
  onReset: () => void;
  onSubmit: () => void;
  pending?: boolean;
  resetLabel: string;
  saveLabel: string;
  submitDisabled?: boolean;
  title: string;
}

export const PaymentWorkflowHeader = ({
  backLabel,
  onBack,
  onReset,
  onSubmit,
  pending,
  resetLabel,
  saveLabel,
  submitDisabled,
  title
}: PaymentWorkflowHeaderProps) => (
  <div className="sticky top-0 z-20 rounded-lg border border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
        <Badge variant="secondary" className="h-8 px-3">
          {title}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" disabled={pending || submitDisabled} onClick={onSubmit}>
          <Save className="h-4 w-4" />
          {saveLabel}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          {resetLabel}
        </Button>
      </div>
    </div>
  </div>
);

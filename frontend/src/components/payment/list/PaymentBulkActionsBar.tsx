import { ChevronDown, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface PaymentBulkActionsBarProps {
  actionsLabel: string;
  clearLabel: string;
  removeLabel: string;
  selectedCount: number;
  selectedCountLabel: string;
  onClearSelection: () => void;
  onRequestBulkDelete: () => void;
}

export const PaymentBulkActionsBar = ({
  actionsLabel,
  clearLabel,
  removeLabel,
  selectedCount,
  selectedCountLabel,
  onClearSelection,
  onRequestBulkDelete
}: PaymentBulkActionsBarProps) => (
  <div className="flex flex-col gap-3 border-b border-zinc-200 bg-primary/5 px-4 py-3 dark:border-zinc-800 dark:bg-primary/10 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-sm text-zinc-500 hover:bg-white/80 dark:text-zinc-400 dark:hover:bg-zinc-900"
        onClick={onClearSelection}
        aria-label={clearLabel}
      >
        <X className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {selectedCountLabel}
      </span>
    </div>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="h-9 rounded-sm bg-white dark:bg-zinc-950">
          {actionsLabel}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onClearSelection}>
          <X className="h-4 w-4" />
          {clearLabel}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="bg-rose-50 text-rose-600 focus:bg-rose-100 focus:text-rose-700 dark:bg-rose-950/20 dark:focus:bg-rose-950/40"
          disabled={selectedCount === 0}
          onClick={onRequestBulkDelete}
        >
          <Trash2 className="h-4 w-4" />
          {removeLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

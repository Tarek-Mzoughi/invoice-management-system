import React from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/shared';

export interface StatusOption {
  value: string;
  labelKey: string;
}

interface GenericStatusDialogProps {
  className?: string;
  sequential?: string;
  currentStatus?: string;
  open: boolean;
  onConfirm: (status: string) => void;
  isPending?: boolean;
  onClose: () => void;
  title: string;
  documentLabel?: string;
  statuses: StatusOption[];
  getStatusBadgeClassName: (status?: string) => string;
  translateStatus: (status: string) => string;
}

export const GenericStatusDialog: React.FC<GenericStatusDialogProps> = ({
  className,
  sequential,
  currentStatus,
  open,
  onConfirm,
  isPending,
  onClose,
  title,
  documentLabel = 'DOCUMENT',
  statuses,
  getStatusBadgeClassName,
  translateStatus
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [selectedStatus, setSelectedStatus] = React.useState<string | undefined>(currentStatus);
  const [selectOpen, setSelectOpen] = React.useState(false);
  const selectTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const closingRef = React.useRef(false);
  const selectCloseFrameRef = React.useRef<number | null>(null);

  const clearOverlayFocus = React.useCallback(() => {
    selectTriggerRef.current?.blur();

    if (typeof document !== 'undefined') {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }

      // Move focus outside Radix-managed overlays before they receive aria-hidden.
      document.body.setAttribute('tabindex', '-1');
      document.body.focus({ preventScroll: true });
      window.setTimeout(() => {
        document.body.removeAttribute('tabindex');
      }, 0);
    }
  }, []);

  const closeSelectDeferred = React.useCallback(() => {
    if (typeof window === 'undefined') {
      setSelectOpen(false);
      return;
    }

    if (selectCloseFrameRef.current !== null) {
      window.cancelAnimationFrame(selectCloseFrameRef.current);
    }

    selectCloseFrameRef.current = window.requestAnimationFrame(() => {
      selectCloseFrameRef.current = null;
      setSelectOpen(false);
    });
  }, []);

  const closeSelectImmediately = React.useCallback(() => {
    if (selectCloseFrameRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(selectCloseFrameRef.current);
      selectCloseFrameRef.current = null;
    }

    flushSync(() => {
      setSelectOpen(false);
    });
  }, []);

  const requestClose = React.useCallback(() => {
    if (closingRef.current) return;

    closingRef.current = true;
    closeSelectImmediately();
    clearOverlayFocus();
    onClose();
  }, [clearOverlayFocus, closeSelectImmediately, onClose]);

  const handleValueChange = React.useCallback(
    (val: string) => {
      setSelectedStatus(val);
      clearOverlayFocus();
      closeSelectDeferred();
    },
    [clearOverlayFocus, closeSelectDeferred]
  );

  const handleConfirm = React.useCallback(() => {
    if (!selectedStatus || selectedStatus === currentStatus) return;

    closeSelectImmediately();
    clearOverlayFocus();
    onConfirm(selectedStatus);
  }, [clearOverlayFocus, closeSelectImmediately, currentStatus, onConfirm, selectedStatus]);

  React.useEffect(() => {
    if (!open) {
      closingRef.current = false;
      return;
    }

    closingRef.current = false;

    if (currentStatus && statuses.some((status) => status.value === currentStatus)) {
      setSelectedStatus(currentStatus);
      return;
    }

    setSelectedStatus(statuses[0]?.value);
  }, [open, currentStatus, statuses]);

  React.useEffect(
    () => () => {
      if (selectCloseFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(selectCloseFrameRef.current);
      }
    },
    []
  );

  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status) return null;
    return (
      <Badge className={cn('px-3 py-1 font-medium', getStatusBadgeClassName(status))}>
        {translateStatus(status)}
      </Badge>
    );
  };

  const body = (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex items-center gap-4 rounded-lg bg-blue-50/50 p-4 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
        <div className="rounded-md bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
            {documentLabel}
          </span>
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {sequential || '-'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6 pb-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
            {tInvoicing('quotation.current_status', { defaultValue: 'STATUT ACTUEL' })}
          </span>
          <div className="h-10 flex items-center">
            <StatusBadge status={currentStatus} />
          </div>
        </div>

        <div className="flex h-10 items-center justify-center text-zinc-400">
          <ArrowRight className="h-5 w-5" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
            {tInvoicing('quotation.new_status', { defaultValue: 'NOUVEAU STATUT' })}
          </span>
          <Select
            open={selectOpen}
            onOpenChange={setSelectOpen}
            value={selectedStatus}
            onValueChange={handleValueChange}
          >
            <SelectTrigger ref={selectTriggerRef} className="h-10 bg-white dark:bg-zinc-950">
              <SelectValue>{selectedStatus && <StatusBadge status={selectedStatus} />}</SelectValue>
            </SelectTrigger>
            <SelectContent
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                clearOverlayFocus();
              }}
            >
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <StatusBadge status={s.value} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-end gap-2 pt-2">
      <Button variant="outline" onClick={requestClose} disabled={isPending}>
        {tCommon('commands.back', { defaultValue: 'Retour' })}
      </Button>
      <Button
        onClick={handleConfirm}
        disabled={isPending || !selectedStatus || selectedStatus === currentStatus}
        className="min-w-30 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isPending ? (
          <Spinner className="h-4 w-4" />
        ) : (
          tCommon('commands.confirm', { defaultValue: 'Confirmer' })
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
        <DialogContent
          className={cn(
            'w-full sm:max-w-140 p-8 data-[state=closed]:animate-none data-[state=closed]:duration-0',
            className
          )}
          onEscapeKeyDown={clearOverlayFocus}
          onPointerDownOutside={clearOverlayFocus}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            clearOverlayFocus();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="hidden">{title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {body}
            {footer}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onClose={requestClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl font-semibold">{title}</DrawerTitle>
          <DrawerDescription className="hidden">{title}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{body}</div>
        <DrawerFooter className="pt-4">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

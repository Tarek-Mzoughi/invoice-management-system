import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { FirmModuleConfig } from './firm-table.types';

interface FirmDeleteDialogProps {
  config: FirmModuleConfig;
  firmName?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}

export function FirmDeleteDialog({
  config,
  firmName,
  loading,
  onClose,
  onConfirm,
  open
}: FirmDeleteDialogProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');
  const prefix = `firm.modules.${config.moduleKey}`;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-[520px] gap-0 p-0">
        <DialogHeader className="space-y-3 px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="space-y-2">
              <DialogTitle>{tContacts(`${prefix}.delete_title`)}</DialogTitle>
              <DialogDescription className="leading-6">
                {tContacts(`${prefix}.delete_description`)}
                {firmName ? (
                  <span className="mt-2 block font-medium text-zinc-700 dark:text-zinc-300">
                    {firmName}
                  </span>
                ) : null}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {tCommon('commands.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {tCommon('commands.delete')}
            <Spinner className="ml-2" size="small" show={loading} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


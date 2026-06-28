import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/shared';
import { cn } from '@/lib/utils';
import { CreatePriceListDto, PriceList } from '@/types';

interface PriceListFormDialogProps {
  className?: string;
  initialValue?: PriceList;
  open: boolean;
  pending?: boolean;
  submitLabel?: string;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: (value: CreatePriceListDto) => void;
}

export const PriceListFormDialog = ({
  className,
  initialValue,
  open,
  pending,
  submitLabel,
  title,
  description,
  onClose,
  onSubmit
}: PriceListFormDialogProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const [name, setName] = React.useState('');
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setName(initialValue?.name || '');
    setActive(initialValue?.active ?? true);
  }, [initialValue, open]);

  const handleSubmit = () => {
    onSubmit({ name: name.trim(), active });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className={cn('sm:max-w-[425px]', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{tSettings('price_lists.fields.name')}</Label>
            <Input
              className="h-10 rounded-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              disabled={pending}
              placeholder={tSettings('price_lists.placeholders.name')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              {tSettings('price_lists.hints.name')}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>{tSettings('price_lists.fields.active')}</Label>
              <p className="text-sm text-muted-foreground">
                {tSettings('price_lists.hints.active')}
              </p>
            </div>
            <Switch checked={active} disabled={pending} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {tCommon('commands.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {submitLabel || tCommon('commands.save')}
            <Spinner className="ml-2" size="small" show={pending} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

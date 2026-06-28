import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { useInvoiceManager } from '../hooks/useInvoiceManager';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';

interface InvoiceGeneralConditionsProps {
  className?: string;
  hidden?: boolean;
  isPending?: boolean;
  defaultCondition?: string;
  edit?: boolean;
}

export const InvoiceGeneralConditions = ({
  className,
  hidden,
  isPending,
  defaultCondition,
  edit = true
}: InvoiceGeneralConditionsProps) => {
  const router = useRouter();
  const { t: tSettings } = useTranslation('settings');
  const tInvoice = useSellingInvoiceLabels().t;

  const invoiceManager = useInvoiceManager();

  return (
    <div className={cn(className)}>
      {!hidden && (
        <div className="flex flex-col gap-4">
          <Textarea
            disabled={!edit}
            placeholder={tInvoice('attributes.general_condition')}
            className="resize-none"
            value={invoiceManager.generalConditions}
            onChange={(e) => invoiceManager.set('generalConditions', e.target.value)}
            isPending={isPending}
            rows={7}
          />
          {edit && defaultCondition && (
            <div className="flex items-center gap-4">
              <div className="flex gap-2 items-center">
                <Button
                  disabled={invoiceManager.generalConditions == defaultCondition}
                  onClick={() => {
                    invoiceManager.set('generalConditions', defaultCondition);
                  }}
                >
                  {tInvoice('use_default_condition')}
                </Button>
                <Button
                  variant={'secondary'}
                  onClick={() => {
                    invoiceManager.set('generalConditions', '');
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
          {edit && !defaultCondition && (
            <Label
              className="font-bold underline cursor-pointer"
              onClick={() => router.push('/settings/system/conditions')}
            >
              {tSettings('default_condition.not_set')}
            </Label>
          )}
        </div>
      )}
    </div>
  );
};

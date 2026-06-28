import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useCustomerOrderManager } from '../hooks/useCustomerOrderManager';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';

interface CustomerOrderGeneralConditionsProps {
  className?: string;
  hidden?: boolean;
  isPending?: boolean;
  defaultCondition?: string;
  edit?: boolean;
}

export const CustomerOrderGeneralConditions = ({
  className,
  hidden,
  isPending,
  defaultCondition,
  edit = true
}: CustomerOrderGeneralConditionsProps) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tSettings } = useTranslation('settings');

  const customerOrderManager = useCustomerOrderManager();

  return (
    <div className={cn(className)}>
      {!hidden && (
        <div className="flex flex-col gap-4">
          <Textarea
            disabled={!edit}
            placeholder={tInvoicing('customerOrder.attributes.general_condition')}
            className="min-h-[180px] resize-none"
            value={customerOrderManager.generalConditions}
            onChange={(e) => customerOrderManager.set('generalConditions', e.target.value)}
            isPending={isPending}
            rows={7}
          />
          {edit && defaultCondition && (
            <div className="flex items-center gap-4">
              <div className="flex gap-2 items-center">
                <Button
                  disabled={customerOrderManager.generalConditions == defaultCondition}
                  onClick={() => {
                    customerOrderManager.set('generalConditions', defaultCondition);
                  }}
                >
                  {tInvoicing('customerOrder.use_default_condition')}
                </Button>
                <Button
                  variant={'secondary'}
                  onClick={() => {
                    customerOrderManager.set('generalConditions', '');
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

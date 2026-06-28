import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useGoodsIssueNoteManager } from '../hooks/useGoodsIssueNoteManager';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';

interface GoodsIssueNoteGeneralConditionsProps {
  className?: string;
  hidden?: boolean;
  isPending?: boolean;
  defaultCondition?: string;
  edit?: boolean;
}

export const GoodsIssueNoteGeneralConditions = ({
  className,
  hidden,
  isPending,
  defaultCondition,
  edit = true
}: GoodsIssueNoteGeneralConditionsProps) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tSettings } = useTranslation('settings');

  const goodsIssueNoteManager = useGoodsIssueNoteManager();

  return (
    <div className={cn(className)}>
      {!hidden && (
        <div className="flex flex-col gap-4">
          <Textarea
            disabled={!edit}
            placeholder={tInvoicing('goodsIssueNote.attributes.general_condition')}
            className="min-h-[180px] resize-none"
            value={goodsIssueNoteManager.generalConditions}
            onChange={(e) => goodsIssueNoteManager.set('generalConditions', e.target.value)}
            isPending={isPending}
            rows={7}
          />
          {edit && defaultCondition && (
            <div className="flex items-center gap-4">
              <div className="flex gap-2 items-center">
                <Button
                  disabled={goodsIssueNoteManager.generalConditions == defaultCondition}
                  onClick={() => {
                    goodsIssueNoteManager.set('generalConditions', defaultCondition);
                  }}
                >
                  {tInvoicing('goodsIssueNote.use_default_condition')}
                </Button>
                <Button
                  variant={'secondary'}
                  onClick={() => {
                    goodsIssueNoteManager.set('generalConditions', '');
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

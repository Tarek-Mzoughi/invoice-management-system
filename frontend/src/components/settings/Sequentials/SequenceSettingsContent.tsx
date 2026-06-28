import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { ResponseSequenceDto, Sequences, UpdateSequentialDto } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { SequentialItem } from './SequentialItem';

interface SequenceSettingsContentProps {
  className?: string;
}

const SELLING_SEQUENCE_ITEMS: { label: Sequences; titleKey: string }[] = [
  { label: Sequences.QUOTATION, titleKey: 'sequence.elements.quotation' },
  { label: Sequences.INVOICE, titleKey: 'sequence.elements.invoice' },
  { label: Sequences.DELIVERY_NOTE, titleKey: 'sequence.elements.delivery_note' },
  { label: Sequences.GOODS_ISSUE_NOTE, titleKey: 'sequence.elements.goods_issue_note' },
  { label: Sequences.CUSTOMER_ORDER, titleKey: 'sequence.elements.customer_order' },
  { label: Sequences.CREDIT_NOTE, titleKey: 'sequence.elements.credit_note' },
  { label: Sequences.RETURN_NOTE, titleKey: 'sequence.elements.return_note' }
];

const buildSequenceMap = (sequences: ResponseSequenceDto[]) =>
  SELLING_SEQUENCE_ITEMS.reduce(
    (acc, item) => {
      const sequence = sequences.find((entry) => entry.label === item.label);
      if (sequence) {
        acc[item.label] = sequence;
      }
      return acc;
    },
    {} as Record<Sequences, ResponseSequenceDto>
  );

export const SequenceSettingsContent: React.FC<SequenceSettingsContentProps> = ({
  className
}) => {
  const router = useRouter();
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { setRoutes } = useBreadcrumb();
  const { clearIntro, clearFloating } = useIntro();
  const [draftSequences, setDraftSequences] = React.useState<
    Partial<Record<Sequences, ResponseSequenceDto>>
  >({});

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tCommon('settings.system.sequence') }
    ]);
  }, [router.locale, tCommon, setRoutes]);

  const {
    data: sequences = [],
    isPending: isSequencesPending,
    refetch: refetchSequences
  } = useQuery({
    queryKey: ['sequence-settings'],
    queryFn: () => api.sequence.findAll()
  });

  React.useEffect(() => {
    if (!isSequencesPending) {
      setDraftSequences(buildSequenceMap(sequences));
    }
  }, [sequences, isSequencesPending]);

  const { mutate: saveSequences, isPending: isSavingSequences } = useMutation({
    mutationFn: async () => {
      const updates = SELLING_SEQUENCE_ITEMS.map((item) => draftSequences[item.label]).filter(
        (sequence): sequence is ResponseSequenceDto => Boolean(sequence?.id)
      );

      await Promise.all(
        updates.map((sequence) =>
          api.sequence.update(sequence.id, {
            prefix: sequence.prefix,
            dateFormat: sequence.dateFormat,
            next: sequence.next
          })
        )
      );
    },
    onSuccess: async () => {
      toast.success(tSettings('sequence.action_update_success'));
      await refetchSequences();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('settings', error, tSettings('sequence.action_update_failure'))
      );
    }
  });

  const handleSequenceChange = (
    label: Sequences,
    field: keyof UpdateSequentialDto,
    value: string | number
  ) => {
    setDraftSequences((current) => {
      const existingSequence = current[label];
      if (!existingSequence) return current;

      return {
        ...current,
        [label]: {
          ...existingSequence,
          [field]: value
        }
      };
    });
  };
  const handleCancel = () => {
    setDraftSequences(buildSequenceMap(sequences));
  };

  const isPending = isSequencesPending || isSavingSequences;

  React.useEffect(() => {
    return () => {
      clearIntro?.();
      clearFloating?.();
    };
  }, [clearIntro, clearFloating]);

  if (isSequencesPending) return <Spinner show />;

  return (
    <div className={cn('flex flex-1 flex-col overflow-auto px-4 py-5 lg:px-8 lg:py-6', className)}>
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <div className="flex flex-wrap items-start gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg px-4 text-sm font-medium transition-all"
            onClick={() => router.push('/settings')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon('commands.back')}
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              className="h-10 rounded-lg px-4"
              disabled={isPending}
              onClick={handleCancel}
            >
              {tCommon('commands.cancel')}
            </Button>
            <Button
              className="h-10 rounded-lg px-6"
              disabled={isPending}
              onClick={() => saveSequences()}
            >
              {tCommon('commands.save')}
              <Spinner className="ml-2" size="small" show={isSavingSequences} />
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
            {tSettings('sequence.title')}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {tSettings('sequence.card_description')}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {SELLING_SEQUENCE_ITEMS.map((item) => {
              const sequence = draftSequences[item.label];
              return (
                <SequentialItem
                  key={item.label}
                  title={tSettings(item.titleKey)}
                  prefix={sequence?.prefix}
                  dateFormat={sequence?.dateFormat}
                  nextNumber={sequence?.next}
                  loading={isPending}
                  onSequenceChange={(key, value) => handleSequenceChange(item.label, key, value)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

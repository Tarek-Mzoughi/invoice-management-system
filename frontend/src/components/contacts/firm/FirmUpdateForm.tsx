import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useActivities from '@/hooks/content/useActivities';
import useCountry from '@/hooks/content/useCountry';
import useCurrency from '@/hooks/content/useCurrency';
import usePaymentCondition from '@/hooks/content/usePaymentCondition';
import { useFirmStore } from '@/hooks/stores/useFirmStore';
import { cn } from '@/lib/utils';
import { UpdateFirmDto } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { FirmEditorContent } from '@/components/contacts/shared/form/FirmEditorContent';
import {
  CLIENT_FIRM_MODULE_CONFIG,
  SUPPLIER_FIRM_MODULE_CONFIG
} from '@/components/contacts/shared/firm-navigation';
import { getFirmEntityContext } from './utils/entity-context';
import type { FirmEntityContext } from './utils/entity-context';

interface FirmFormProps {
  className?: string;
  detailHref?: (id: number) => string;
  entityOverride?: FirmEntityContext;
  firmId?: number;
  listHref?: string;
}

export const FirmUpdateForm = ({
  className,
  detailHref,
  entityOverride,
  firmId,
  listHref: listHrefOverride
}: FirmFormProps) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tContact } = useTranslation('contacts');
  const { setRoutes } = useBreadcrumb();
  const firmStore = useFirmStore();
  const entity = entityOverride ?? getFirmEntityContext(router.query.entity);
  const moduleConfig =
    entity === 'suppliers' ? SUPPLIER_FIRM_MODULE_CONFIG : CLIENT_FIRM_MODULE_CONFIG;
  const listHref = listHrefOverride ?? moduleConfig.listPath;
  const backHref = firmId ? detailHref?.(firmId) ?? moduleConfig.detailPath(firmId) : listHref;
  const listLabel = tContact(`firm.context.${entity}.label`);
  const singularLabel = tContact(`firm.context.${entity}.singular`);
  const updateTitle = tContact(`firm.context.${entity}.update_page_title`);

  const { data: firm, isPending: isFetchFirmPending } = useQuery({
    queryKey: ['firm', firmId],
    queryFn: () => api.firm.findOne(firmId),
    enabled: !!firmId
  });

  const { data: bankAccounts, isPending: isFetchBankAccountsPending } = useQuery({
    queryKey: ['firm-bank-accounts', firmId],
    queryFn: () => api.firmBankAccount.find(firmId),
    enabled: !!firmId
  });

  const updateDescription = tContact(`firm.context.${entity}.update_page_description`, {
    firmName: firm?.name || ''
  });

  React.useEffect(() => {
    if (!firm) return;
    firmStore.reset();
    firmStore.setFirm({
      ...firm,
      bankAccounts: bankAccounts || []
    });
  }, [firm, bankAccounts]);

  React.useEffect(() => {
    if (!firmId) return;

    setRoutes?.([
      { title: tCommon('menu.contacts'), href: '/contacts' },
      { title: listLabel, href: listHref },
      {
        title: firm?.name || `${singularLabel} N°${firmId}`,
        href: backHref
      },
      { title: tCommon('commands.edit') }
    ]);
  }, [backHref, firm?.name, firmId, listHref, listLabel, router.locale, setRoutes, singularLabel, tCommon]);

  const { activities, isFetchActivitiesPending } = useActivities();
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { countries, isFetchCountriesPending } = useCountry();
  const { paymentConditions, isFetchPaymentConditionsPending } = usePaymentCondition();

  const loading =
    isFetchFirmPending ||
    isFetchBankAccountsPending ||
    isFetchActivitiesPending ||
    isFetchCurrenciesPending ||
    isFetchCountriesPending ||
    isFetchPaymentConditionsPending;

  const { mutate: updateFirm, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: UpdateFirmDto) => api.firm.update(data),
    onSuccess: async () => {
      const finalAccounts = firmStore.bankAccounts || [];
      const originalAccounts = firmStore.snapshot?.bankAccounts || [];
      
      const deleted = originalAccounts.filter(orig => !finalAccounts.some(curr => curr.id === orig.id));
      const added = finalAccounts.filter(curr => !curr.id);
      const updated = finalAccounts.filter(curr => curr.id && originalAccounts.some(orig => orig.id === curr.id));

      if (deleted.length > 0 || added.length > 0 || updated.length > 0) {
        try {
          await Promise.all([
            ...deleted.map(acc => api.firmBankAccount.remove(acc.id!)),
            ...added.map(acc => api.firmBankAccount.create({ ...acc, firmId })),
            ...updated.map(acc => api.firmBankAccount.update(acc as any))
          ]);
        } catch (err) {
          console.error('Failed to update bank accounts:', err);
          toast.error(tContact('firm.errors.bank_accounts_update_failed'));
        }
      }

      toast.success(tContact('firm.action_update_success'));
      router.push(backHref);
    },
    onError: (error) => {
      toast.error(getErrorMessage('contacts', error, tContact('firm.action_update_failure')));
    }
  });

  const handleSubmit = () => {
    const data = firmStore.getFirm() as UpdateFirmDto;
    data.entityType = entity;
    const validation = api.firm.validate(data);
    if (validation.message) {
      toast.error(tContact(validation.message));
      return;
    }

    // Validate bank accounts first
    const accounts = firmStore.bankAccounts || [];
    for (const account of accounts) {
      const accValidation = api.firmBankAccount.validate(account);
      if (accValidation.message) {
        toast.error(tContact(accValidation.message));
        return;
      }
    }

    updateFirm(data);
  };

  if (loading) return <Spinner className="h-screen" show={loading} />;

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <div className={cn('flex flex-col gap-6 pb-8', isUpdatePending ? 'pointer-events-none' : '')}>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {updateTitle}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {updateDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-11 rounded-md px-5" onClick={() => router.push(backHref)}>
                <ArrowLeft className="h-4 w-4" />
                {tCommon('commands.back')}
              </Button>
              <Button className="h-11 rounded-md px-5" onClick={handleSubmit}>
                {tCommon('commands.save')}
                <Spinner className="ml-2" size="small" show={isUpdatePending} />
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-lg border-zinc-200 shadow-sm dark:border-zinc-800">
          <CardContent className="space-y-8 p-6">
            <FirmEditorContent
              activities={activities}
              currencies={currencies}
              countries={countries}
              paymentConditions={paymentConditions}
              entity={entity}
              loading={loading || isUpdatePending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

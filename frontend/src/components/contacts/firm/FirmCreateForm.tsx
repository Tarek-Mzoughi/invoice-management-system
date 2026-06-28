import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useFirmStore } from '@/hooks/stores/useFirmStore';
import useActivities from '@/hooks/content/useActivities';
import useCountry from '@/hooks/content/useCountry';
import useCurrency from '@/hooks/content/useCurrency';
import usePaymentCondition from '@/hooks/content/usePaymentCondition';
import { cn } from '@/lib/utils';
import { CreateFirmDto } from '@/types';
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
  entityOverride?: FirmEntityContext;
  listHref?: string;
}

export const FirmCreateForm = ({ className, entityOverride, listHref: listHrefOverride }: FirmFormProps) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tContact } = useTranslation('contacts');
  const { setRoutes } = useBreadcrumb();
  const firmStore = useFirmStore();
  const entity = entityOverride ?? getFirmEntityContext(router.query.entity);
  const moduleConfig =
    entity === 'suppliers' ? SUPPLIER_FIRM_MODULE_CONFIG : CLIENT_FIRM_MODULE_CONFIG;
  const backHref = listHrefOverride ?? moduleConfig.listPath;
  const listLabel = tContact(`firm.context.${entity}.label`);
  const createTitle = tContact(`firm.context.${entity}.create_page_title`);
  const createDescription = tContact(`firm.context.${entity}.create_page_description`);

  React.useEffect(() => {
    setRoutes?.([
      { title: listLabel, href: backHref },
      { title: createTitle }
    ]);
  }, [backHref, createTitle, listLabel, router.locale, setRoutes, tCommon]);

  const { activities, isFetchActivitiesPending } = useActivities();
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { countries, isFetchCountriesPending } = useCountry();
  const { paymentConditions, isFetchPaymentConditionsPending } = usePaymentCondition();

  const loading =
    isFetchActivitiesPending ||
    isFetchCurrenciesPending ||
    isFetchCountriesPending ||
    isFetchPaymentConditionsPending;

  React.useEffect(() => {
    firmStore.reset();
    firmStore.set('entityType' as never, entity);
  }, [entity]);

  const { mutate: createFirm, isPending: isCreatePending } = useMutation({
    mutationFn: (data: CreateFirmDto) => api.firm.create(data),
    onSuccess: async (createdFirm) => {
      const accounts = firmStore.bankAccounts || [];
      if (accounts.length > 0) {
        try {
          await Promise.all(
            accounts.map((account) =>
              api.firmBankAccount.create({
                ...account,
                firmId: createdFirm.id
              })
            )
          );
        } catch (err) {
          console.error('Failed to save bank accounts:', err);
          toast.error(tContact('firm.errors.bank_accounts_save_failed'));
        }
      }
      firmStore.reset();
      router.push(backHref);
      toast.success(tContact('firm.action_add_success'));
    },
    onError: (error) => {
      toast.error(getErrorMessage('contacts', error, tContact('firm.action_add_failure')));
    }
  });

  const handleSubmit = () => {
    const data = firmStore.getFirm() as CreateFirmDto;
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

    createFirm(data);
  };

  if (loading) return <Spinner className="h-screen" show={loading} />;

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <div className={cn('flex flex-col gap-6 pb-8', isCreatePending ? 'pointer-events-none' : '')}>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {createTitle}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {createDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-11 rounded-md px-5" onClick={() => router.push(backHref)}>
                <ArrowLeft className="h-4 w-4" />
                {tCommon('commands.back')}
              </Button>
              <Button className="h-11 rounded-md px-5" onClick={handleSubmit}>
                {tCommon('commands.create')}
                <Spinner className="ml-2" size="small" show={isCreatePending} />
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
              loading={loading || isCreatePending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

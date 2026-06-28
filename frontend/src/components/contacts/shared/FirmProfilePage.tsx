import React from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/api';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { cn } from '@/lib/utils';
import {
  getFirmPhone,
  getMainFirmInterlocutorEntry,
  getMainFirmInterlocutorName
} from './firm-formatters';
import type { FirmModuleConfig } from './firm-table.types';
import { useGuardedNavigation } from '@/features/rbac/useGuardedNavigation';

interface FirmProfilePageProps {
  className?: string;
  config: FirmModuleConfig;
  firmId: number;
}

const valueClassName = 'font-medium text-zinc-950 dark:text-zinc-50';
const labelClassName = 'text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400';

function InfoField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className={labelClassName}>{label}</p>
      <div className={valueClassName}>{value || '-'}</div>
    </div>
  );
}

export function FirmProfilePage({ className, config, firmId }: FirmProfilePageProps) {
  const router = useRouter();
  const guardedNavigation = useGuardedNavigation();
  const { t: tCommon } = useTranslation('common');
  const { t: tContacts } = useTranslation('contacts');
  const { setRoutes } = useBreadcrumb();
  const prefix = `firm.modules.${config.moduleKey}`;

  const { data: firm, isPending } = useQuery({
    queryKey: ['firm', firmId],
    queryFn: () => api.firm.findOne(firmId),
    enabled: !!firmId
  });

  const mainEntry = firm ? getMainFirmInterlocutorEntry(firm) : undefined;
  const mainInterlocutor = mainEntry?.interlocutor;

  React.useEffect(() => {
    setRoutes?.([
      { title: tContacts(`${prefix}.title`), href: config.listPath },
      { title: firm?.name || tContacts(`${prefix}.detail_title`) }
    ]);
  }, [config.listPath, firm?.name, prefix, router.locale, setRoutes, tContacts]);

  if (isPending) return <Spinner className="h-screen" show={isPending} />;

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <div className="flex flex-col gap-6 pb-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {tContacts(`${prefix}.detail_title`)}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {firm?.name || '-'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-md px-5"
                onClick={() => router.push(config.listPath)}
              >
                <ArrowLeft className="h-4 w-4" />
                {tCommon('commands.back')}
              </Button>
              <Button
                className="h-11 rounded-md px-5"
                onClick={() => firmId && guardedNavigation.push(config.editPath(firmId))}
              >
                <Pencil className="h-4 w-4" />
                {tContacts(`${prefix}.edit_title`)}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-lg border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>{tContacts('firm.sections.business_information')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <InfoField label={tContacts('firm.attributes.entreprise_name')} value={firm?.name} />
              <InfoField
                label={tContacts('firm.attributes.type')}
                value={
                  firm?.isPerson
                    ? tContacts('firm.attributes.particular_entreprise_type')
                    : tContacts('firm.attributes.entreprise_type')
                }
              />
              <InfoField label={tContacts('firm.attributes.tax_number')} value={firm?.taxIdNumber} />
              <InfoField label={tContacts('firm.attributes.phone')} value={getFirmPhone(firm || {})} />
              <InfoField label={tContacts('firm.attributes.website')} value={firm?.website} />
              <InfoField label={tContacts('firm.attributes.activity')} value={firm?.activity?.label} />
              <InfoField
                label={tContacts('firm.attributes.currency')}
                value={firm?.currency ? `${firm.currency.code} (${firm.currency.symbol})` : undefined}
              />
              <InfoField
                label={tContacts('firm.attributes.payment_conditions')}
                value={firm?.paymentCondition?.label}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>{tContacts('firm.sections.main_contact')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <InfoField label={tContacts('interlocutor.attributes.name')} value={firm ? getMainFirmInterlocutorName(firm) : undefined} />
              <InfoField label={tContacts('interlocutor.attributes.position')} value={mainEntry?.position} />
              <InfoField label={tContacts('interlocutor.attributes.email')} value={mainInterlocutor?.email} />
              <InfoField label={tContacts('interlocutor.attributes.phone')} value={mainInterlocutor?.phone} />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>{tContacts('firm.sections.invoicing_address')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <InfoField label={tContacts('common.address.address')} value={firm?.invoicingAddress?.address} />
              <InfoField label={tContacts('common.address.address2')} value={firm?.invoicingAddress?.address2} />
              <InfoField label={tContacts('common.address.region')} value={firm?.invoicingAddress?.region} />
              <InfoField label={tContacts('common.address.zip_code')} value={firm?.invoicingAddress?.zipcode} />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>{tContacts('firm.sections.delivery_address')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <InfoField label={tContacts('common.address.address')} value={firm?.deliveryAddress?.address} />
              <InfoField label={tContacts('common.address.address2')} value={firm?.deliveryAddress?.address2} />
              <InfoField label={tContacts('common.address.region')} value={firm?.deliveryAddress?.region} />
              <InfoField label={tContacts('common.address.zip_code')} value={firm?.deliveryAddress?.zipcode} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Mail,
  RotateCcw,
  Save,
  UserRound
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useActivities from '@/hooks/content/useActivities';
import useCabinet from '@/hooks/content/useCabinet';
import { useActiveCabinet } from '@/hooks/content/useCabinetSwitcher';
import useCountry from '@/hooks/content/useCountry';
import useCurrency from '@/hooks/content/useCurrency';
import useInitializedState from '@/hooks/use-initialized-state';
import { useUploadPreviewUrl } from '@/hooks/use-upload-preview-url';
import { cn } from '@/lib/utils';
import { Cabinet } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { CabinetEditorContent } from './CabinetEditorContent';
import { useCabinetManager } from './hooks/useCabinetManager';

interface CabinetPortalProps {
  className?: string;
}

const CabinetPortal: React.FC<CabinetPortalProps> = ({ className }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes } = useBreadcrumb();
  const { activeCabinet } = useActiveCabinet();
  const { cabinet, isFetchCabinetPending, error, refetchCabinet } = useCabinet();
  const { activities, isFetchActivitiesPending } = useActivities();
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { countries, isFetchCountriesPending } = useCountry();
  const cabinetManager = useCabinetManager();
  const storedLogoUrl = useUploadPreviewUrl({ id: cabinet?.logoId });
  const [uploadedLogoUrl, setUploadedLogoUrl] = React.useState('');

  React.useEffect(() => {
    if (!cabinetManager.logo) {
      setUploadedLogoUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(cabinetManager.logo);
    setUploadedLogoUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [cabinetManager.logo]);

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings') },
      { title: tCommon('submenu.account') },
      { title: tCommon('settings.account.my_cabinet') }
    ]);
  }, [router.locale, setRoutes, tCommon]);

  const { mutate: updateCabinet, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: Cabinet) => api.cabinet.update(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cabinet'] });
      await refetchCabinet();
      toast.success(tSettings('cabinet.messages.update_success'));
    },
    onError: (mutationError) => {
      toast.error(
        getErrorMessage('settings', mutationError, tSettings('cabinet.messages.update_error'))
      );
    }
  });

  const loading =
    isFetchCabinetPending ||
    isFetchCurrenciesPending ||
    isFetchActivitiesPending ||
    isFetchCountriesPending ||
    isUpdatePending;

  const { isDisabled, globalReset, setInitialData } = useInitializedState({
    data: cabinet || ({} as Partial<Cabinet>),
    getCurrentData: () => cabinetManager.getCabinet(),
    setFormData: (data: Partial<Cabinet>) => cabinetManager.setCabinet(data),
    resetData: () => cabinetManager.reset(),
    loading,
    resetKey: activeCabinet?.id
  });

  const hasPendingChanges = !isDisabled && !loading;
  const saveStatusLabel = loading
    ? tSettings('cabinet.status.saving')
    : hasPendingChanges
      ? tSettings('cabinet.status.unsaved')
      : tSettings('cabinet.status.saved');

  const handleSubmit = () => {
    const data = cabinetManager.getCabinet();
    const validation = api.cabinet.validate(data);
    if (validation.message) {
      toast.error(tSettings(validation.message));
      return;
    }

    updateCabinet(data as Cabinet, {
      onSuccess: () => setInitialData(cabinetManager.getCabinet())
    });
  };

  const displayName =
    cabinetManager.enterpriseName?.trim() ||
    cabinet?.enterpriseName ||
    activeCabinet?.enterpriseName ||
    tSettings('cabinet.attributes.enterprise_name');
  const displayEmail = cabinetManager.email?.trim() || cabinet?.email;
  const displayTaxId = cabinetManager.taxIdNumber?.trim() || cabinet?.taxIdNumber;
  const logoUrl = uploadedLogoUrl || storedLogoUrl;
  const entityTypeLabel = cabinetManager.isPerson
    ? tSettings('cabinet.options.person')
    : tSettings('cabinet.options.company');

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
        {tSettings('cabinet.messages.load_error')}
      </div>
    );
  }

  if (loading && !cabinet) {
    return <Spinner className="h-full min-h-[360px]" show />;
  }

  return (
    <div
      className={cn(
        'flex flex-1 flex-col overflow-auto bg-zinc-50/60 dark:bg-zinc-950',
        className
      )}
    >
      <div className="flex w-full max-w-none flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 pb-10">
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg border-zinc-200/80 bg-white px-4 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon('commands.back')}
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {tCommon('settings.account.my_cabinet')}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {tSettings('cabinet.title')}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
              {tSettings('cabinet.description')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  loading ? 'bg-amber-500' : hasPendingChanges ? 'bg-primary' : 'bg-emerald-500'
                )}
              />
              <span className="truncate">{saveStatusLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg px-5"
                onClick={globalReset}
                disabled={isDisabled || loading}
              >
                <RotateCcw className="mr-2 size-4" />
                {tCommon('commands.reset')}
              </Button>
              <Button
                type="button"
                className="h-11 rounded-lg px-5 shadow-md shadow-primary/20"
                disabled={isDisabled || loading}
                onClick={handleSubmit}
              >
                <Spinner className="mr-2" size="small" show={isUpdatePending} />
                {!isUpdatePending && <Save className="mr-2 size-4" />}
                {tSettings('cabinet.actions.update')}
              </Button>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="h-1 bg-[linear-gradient(90deg,hsl(var(--primary)),#0ea5e9,#8b5cf6)]" />
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50 shadow-inner dark:border-zinc-800 dark:bg-zinc-900">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={displayName}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="size-8 text-primary/70" />
                )}
              </div>

              <div className="min-w-0 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {tSettings('cabinet.hero.active_workspace')}
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    {displayName}
                  </h2>
                  {displayEmail ? (
                    <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                      <Mail className="size-3.5 shrink-0" />
                      {displayEmail}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-md border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {cabinetManager.isPerson ? (
                      <UserRound className="size-3.5" />
                    ) : (
                      <Building2 className="size-3.5" />
                    )}
                    {entityTypeLabel}
                  </Badge>
                  {displayTaxId ? (
                    <Badge
                      variant="outline"
                      className="rounded-md border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      {tSettings('cabinet.hero.tax_id')}: {displayTaxId}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <CabinetEditorContent
          activities={activities}
          countries={countries}
          currencies={currencies}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CabinetPortal;

import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Activity, Tax } from '@/types';
import { CompanyOnboardingPayload, CompanyPersonType } from '@/types/onboarding';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Factory,
  Hammer,
  MoreHorizontal,
  Store,
  Upload,
  User
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/content/user/useCurrentUser';

type OnboardingStep = 0 | 1 | 2 | 3 | 4;

interface OnboardingFormState {
  activityId?: number;
  activityIsOther?: boolean;
  personType?: CompanyPersonType;
  enterpriseName: string;
  taxIdNumber: string;
  logo?: File;
  address: string;
  city: string;
  postalCode: string;
  countryId?: number;
  selectedTaxTemplateIds: number[];
}

type StoredLogoDraft = {
  name: string;
  type: string;
  lastModified: number;
  dataUrl: string;
};

type StoredOnboardingDraft = {
  step?: OnboardingStep;
  form?: Omit<OnboardingFormState, 'logo'>;
  logo?: StoredLogoDraft;
};

const PERSON_OPTIONS = [
  { value: 'physical' as const, icon: User },
  { value: 'moral' as const, icon: Building2 }
];

const ACTIVITY_ICONS = [Store, BriefcaseBusiness, Factory, Building2, Hammer, MoreHorizontal];
const VAT_TEMPLATE_ORDER = [7, 0, 13, 19];
const EXTRA_TEMPLATE_ORDER = ['timbre fiscal', 'fodec 1%'];
const ONBOARDING_DRAFT_STORAGE_KEY = 'company-onboarding-draft-v1';
const MAX_VISIBLE_ACTIVITIES = 5;

const initialForm: OnboardingFormState = {
  enterpriseName: '',
  taxIdNumber: '',
  address: '',
  city: '',
  postalCode: '',
  selectedTaxTemplateIds: []
};

const isVatTemplate = (tax: Tax) => {
  const label = tax.label?.toLowerCase() || '';
  return label.includes('tva') || label.includes('vat') || (tax.isRate && !tax.isSpecial);
};

const getTaxTemplateOrder = (tax: Tax) => {
  if (isVatTemplate(tax)) {
    const rate = Number(tax.value ?? 0);
    const index = VAT_TEMPLATE_ORDER.findIndex((value) => value === rate);
    return index >= 0 ? index : VAT_TEMPLATE_ORDER.length + rate;
  }

  const label = tax.label?.trim().toLowerCase() || '';
  const index = EXTRA_TEMPLATE_ORDER.findIndex((value) => value === label);
  return 100 + (index >= 0 ? index : EXTRA_TEMPLATE_ORDER.length);
};

const sortTaxTemplates = (a: Tax, b: Tax) => {
  const orderDelta = getTaxTemplateOrder(a) - getTaxTemplateOrder(b);
  if (orderDelta !== 0) return orderDelta;
  return (a.label || '').localeCompare(b.label || '');
};

const readStoredDraft = (storageKey: string): StoredOnboardingDraft | null => {
  if (typeof window === 'undefined') return null;

  try {
    const rawDraft = window.localStorage.getItem(storageKey);
    return rawDraft ? (JSON.parse(rawDraft) as StoredOnboardingDraft) : null;
  } catch {
    return null;
  }
};

const fileToStoredLogo = (file: File): Promise<StoredLogoDraft> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Invalid logo draft'));
        return;
      }

      resolve({
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        dataUrl: reader.result
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const storedLogoToFile = (logoDraft: StoredLogoDraft): File => {
  const [, base64Data = ''] = logoDraft.dataUrl.split(',');
  const byteString = window.atob(base64Data);
  const bytes = new Uint8Array(byteString.length);

  for (let index = 0; index < byteString.length; index += 1) {
    bytes[index] = byteString.charCodeAt(index);
  }

  return new File([bytes], logoDraft.name, {
    type: logoDraft.type,
    lastModified: logoDraft.lastModified
  });
};

const persistDraft = (
  storageKey: string,
  step: OnboardingStep,
  form: OnboardingFormState,
  logoDraft?: StoredLogoDraft
) => {
  if (typeof window === 'undefined') return;

  const storedForm: Omit<OnboardingFormState, 'logo'> = {
    activityId: form.activityId,
    activityIsOther: form.activityIsOther,
    personType: form.personType,
    enterpriseName: form.enterpriseName,
    taxIdNumber: form.taxIdNumber,
    address: form.address,
    city: form.city,
    postalCode: form.postalCode,
    countryId: form.countryId,
    selectedTaxTemplateIds: form.selectedTaxTemplateIds
  };

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ step, form: storedForm, logo: logoDraft })
    );
  } catch {
    window.localStorage.setItem(storageKey, JSON.stringify({ step, form: storedForm }));
  }
};

const removeStoredDraft = (storageKey: string | null) => {
  if (!storageKey || typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey);
};

export function CompanyOnboardingWizard() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = React.useState<OnboardingStep>(0);
  const [form, setForm] = React.useState<OnboardingFormState>(initialForm);
  const [logoDraft, setLogoDraft] = React.useState<StoredLogoDraft | undefined>();
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = React.useState(false);
  const { user: currentUser } = useCurrentUser();
  const draftStorageKey = React.useMemo(
    () => (currentUser?.id ? `${ONBOARDING_DRAFT_STORAGE_KEY}:${currentUser.id}` : null),
    [currentUser?.id]
  );
  const isNewCabinetOnboarding = router.asPath.includes('mode=new');
  const hasCompletedCabinet =
    currentUser?.cabinets?.some((c) => c.onboardingCompleted === true) ?? false;

  const { data: countries = [], isFetching: isCountriesFetching } = useQuery({
    queryKey: ['countries'],
    queryFn: () => api.country.find()
  });

  const { data: activities = [], isFetching: isActivitiesFetching } = useQuery<Activity[]>({
    queryKey: ['onboarding-activities'],
    queryFn: () => api.activity.find()
  });

  const { data: taxTemplates = [], isFetching: isTaxTemplatesFetching } = useQuery<Tax[]>({
    queryKey: ['onboarding-tax-templates'],
    queryFn: () => api.tax.findTemplates()
  });

  const orderedTaxTemplates = React.useMemo(
    () => [...taxTemplates].sort(sortTaxTemplates),
    [taxTemplates]
  );
  const vatTemplates = React.useMemo(
    () => orderedTaxTemplates.filter(isVatTemplate),
    [orderedTaxTemplates]
  );
  const additionalTaxTemplates = React.useMemo(
    () => orderedTaxTemplates.filter((tax) => !isVatTemplate(tax)),
    [orderedTaxTemplates]
  );
  const visibleActivities = React.useMemo(
    () => activities.slice(0, MAX_VISIBLE_ACTIVITIES),
    [activities]
  );

  React.useEffect(() => {
    if (!draftStorageKey || isDraftLoaded) return;

    const storedDraft = readStoredDraft(draftStorageKey);
    if (storedDraft?.form) {
      setForm({
        ...initialForm,
        ...storedDraft.form,
        logo: storedDraft.logo ? storedLogoToFile(storedDraft.logo) : undefined
      });
    }
    setLogoDraft(storedDraft?.logo);
    if (typeof storedDraft?.step === 'number') {
      setStep(Math.min(Math.max(storedDraft.step, 0), 4) as OnboardingStep);
    }
    setIsDraftLoaded(true);
  }, [draftStorageKey, isDraftLoaded]);

  React.useEffect(() => {
    if (!draftStorageKey || !isDraftLoaded) return;
    persistDraft(draftStorageKey, step, form, logoDraft);
  }, [draftStorageKey, form, isDraftLoaded, logoDraft, step]);

  React.useEffect(() => {
    if (!form.activityId || activities.length === 0) return;
    const isSelectedActivityVisible = visibleActivities.some(
      (activity) => activity.id === form.activityId
    );
    if (isSelectedActivityVisible) return;

    setForm((current) => ({
      ...current,
      activityId: undefined,
      activityIsOther: true
    }));
  }, [activities.length, form.activityId, visibleActivities]);

  React.useEffect(() => {
    if (form.countryId || countries.length === 0) return;
    const tunisia = countries.find(
      (country) => country.alpha2Code === 'TN' || country.alpha3Code === 'TUN'
    );
    setForm((current) => ({
      ...current,
      countryId: tunisia?.id ?? countries[0]?.id
    }));
  }, [countries, form.countryId]);

  React.useEffect(() => {
    if (!form.logo) {
      setLogoPreview(null);
      return;
    }

    const nextPreview = URL.createObjectURL(form.logo);
    setLogoPreview(nextPreview);

    return () => URL.revokeObjectURL(nextPreview);
  }, [form.logo]);

  const updateField = <T extends keyof OnboardingFormState>(
    field: T,
    value: OnboardingFormState[T]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectActivity = (activityId?: number) => {
    setForm((current) => ({
      ...current,
      activityId,
      activityIsOther: !activityId
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const logo = event.target.files?.[0];
    updateField('logo', logo);

    if (!logo) {
      setLogoDraft(undefined);
      return;
    }

    void fileToStoredLogo(logo)
      .then(setLogoDraft)
      .catch(() => setLogoDraft(undefined));
  };

  const toggleTaxTemplate = (taxId?: number) => {
    if (!taxId) return;

    setForm((current) => ({
      ...current,
      selectedTaxTemplateIds: current.selectedTaxTemplateIds.includes(taxId)
        ? current.selectedTaxTemplateIds.filter((currentTaxId) => currentTaxId !== taxId)
        : [...current.selectedTaxTemplateIds, taxId]
    }));
  };

  const isStepValid = React.useMemo(() => {
    if (step === 0) return Boolean(form.activityId || form.activityIsOther);
    if (step === 1) return Boolean(form.personType);
    if (step === 2) {
      return Boolean(
        form.enterpriseName.trim() && (form.personType !== 'moral' || form.taxIdNumber.trim())
      );
    }
    if (step === 3) {
      return Boolean(
        form.address.trim() && form.city.trim() && form.postalCode.trim() && form.countryId
      );
    }
    return taxTemplates.length > 0;
  }, [form, step, taxTemplates.length]);

  const { mutate: submitOnboarding, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      const logoId = form.logo ? (await api.upload.uploadFile(form.logo)).id : undefined;
      const selectedTemplates = taxTemplates.filter(
        (tax) => tax.id && form.selectedTaxTemplateIds.includes(tax.id)
      );
      const selectedActivity = form.activityId
        ? activities.find((activity) => activity.id === form.activityId)
        : undefined;
      const payload: CompanyOnboardingPayload = {
        activityId: selectedActivity?.id,
        activityType: selectedActivity?.label,
        createNewCabinet: isNewCabinetOnboarding || undefined,
        personType: form.personType as CompanyPersonType,
        enterpriseName: form.enterpriseName.trim(),
        taxIdNumber: form.taxIdNumber.trim() || undefined,
        logoId,
        address: {
          address: form.address.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          countryId: form.countryId as number
        },
        taxSettings: {
          vatRates: selectedTemplates.filter(isVatTemplate).map((tax) => Number(tax.value ?? 0)),
          additionalTaxes: selectedTemplates
            .filter((tax) => !isVatTemplate(tax))
            .map((tax) => tax.label || String(tax.id))
        },
        selectedTaxTemplateIds: form.selectedTaxTemplateIds
      };
      return api.onboarding.completeCompanyOnboarding(payload);
    },
    onSuccess: async (user) => {
      removeStoredDraft(draftStorageKey);
      queryClient.setQueryData(['current-user'], user);
      if (user.currentCabinetId && user.currentCabinet) {
        queryClient.setQueryData(['cabinet', user.currentCabinetId], user.currentCabinet);
      }

      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['cabinet'] });
      toast.success(t('onboarding.success'));
      router.replace('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('onboarding.error'));
    }
  });

  const goNext = () => {
    if (!isStepValid) return;
    setStep((current) => Math.min(current + 1, 4) as OnboardingStep);
  };

  const goPrevious = () => {
    setStep((current) => Math.max(current - 1, 0) as OnboardingStep);
  };

  const handleSubmit = () => {
    if (!isStepValid || !form.personType || !form.countryId) return;
    submitOnboarding();
  };

  const handleCancel = async () => {
    if (hasCompletedCabinet) {
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      router.replace('/dashboard');
    } else {
      signOut({ callbackUrl: '/auth' });
    }
  };

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-10 flex items-center justify-center">
      <section className="mx-auto w-full max-w-5xl rounded-md border bg-background p-6 shadow-sm md:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              {t('onboarding.step_label', { current: step + 1, total: 5 })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(`onboarding.steps.${step}.subtitle`)}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {t('commands.cancel')}
          </Button>
        </div>

        <div className="mb-8 text-center text-sm text-muted-foreground">
          {t(`onboarding.steps.${step}.description`)}
        </div>

        {step === 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {isActivitiesFetching ? (
              <div className="col-span-full rounded-md border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                {t('table.loading')}
              </div>
            ) : (
              <>
                {visibleActivities.map((activity, index) => {
                  const Icon = ACTIVITY_ICONS[index % ACTIVITY_ICONS.length];
                  const selected = form.activityId === activity.id && !form.activityIsOther;
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => selectActivity(activity.id)}
                      className={cn(
                        'relative min-h-28 rounded-md border p-4 text-left transition-colors hover:border-primary',
                        selected && 'border-primary bg-primary/5'
                      )}
                    >
                      {selected && (
                        <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />
                      )}
                      <Icon className="mb-4 h-7 w-7 text-primary" />
                      <div className="font-medium">{activity.label}</div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => selectActivity()}
                  className={cn(
                    'relative min-h-28 rounded-md border p-4 text-left transition-colors hover:border-primary',
                    form.activityIsOther && 'border-primary bg-primary/5'
                  )}
                >
                  {form.activityIsOther && (
                    <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />
                  )}
                  <MoreHorizontal className="mb-4 h-7 w-7 text-primary" />
                  <div className="font-medium">{t('onboarding.activity_other.title')}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('onboarding.activity_other.description')}
                  </p>
                </button>
              </>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            {PERSON_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = form.personType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField('personType', option.value)}
                  className={cn(
                    'relative min-h-24 rounded-md border p-4 text-left transition-colors hover:border-primary',
                    selected && 'border-primary bg-primary/5'
                  )}
                >
                  {selected && (
                    <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />
                  )}
                  <Icon className="mb-4 h-7 w-7 text-primary" />
                  <div className="font-medium">
                    {t(`onboarding.person_options.${option.value}`)}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 md:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enterpriseName">{t('onboarding.fields.enterprise_name')}</Label>
                <Input
                  id="enterpriseName"
                  placeholder={t('onboarding.placeholders.enterprise_name')}
                  value={form.enterpriseName}
                  onChange={(event) => updateField('enterpriseName', event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxIdNumber">
                  {form.personType === 'moral'
                    ? t('onboarding.fields.tax_id_required')
                    : t('onboarding.fields.tax_id_optional')}
                </Label>
                <Input
                  id="taxIdNumber"
                  placeholder={t('onboarding.placeholders.tax_id')}
                  value={form.taxIdNumber}
                  onChange={(event) => updateField('taxIdNumber', event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">{t('onboarding.fields.logo')}</Label>
              <label
                htmlFor="logo"
                className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-dashed text-center text-sm text-muted-foreground transition-colors hover:border-primary"
              >
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt={form.enterpriseName || t('onboarding.fields.logo')}
                    fill
                    unoptimized
                    sizes="260px"
                    className="object-contain p-3"
                  />
                ) : (
                  <>
                    <Upload className="mb-3 h-8 w-8" />
                    <span className="max-w-40">{t('onboarding.fields.logo_hint')}</span>
                  </>
                )}
              </label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleLogoChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t('onboarding.fields.address')}</Label>
              <Input
                id="address"
                placeholder={t('onboarding.placeholders.address')}
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">{t('onboarding.fields.city')}</Label>
                <Input
                  id="city"
                  placeholder={t('onboarding.placeholders.city')}
                  value={form.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">{t('onboarding.fields.postal_code')}</Label>
                <Input
                  id="postalCode"
                  placeholder={t('onboarding.placeholders.postal_code')}
                  value={form.postalCode}
                  onChange={(event) => updateField('postalCode', event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('onboarding.fields.country')}</Label>
              <Select
                value={form.countryId?.toString()}
                onValueChange={(value) => updateField('countryId', Number(value))}
                disabled={isCountriesFetching || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('onboarding.fields.country_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={(country.id || '').toString()}>
                      {country.alpha3Code || country.alpha2Code || country.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h2 className="mb-2 font-medium">{t('onboarding.taxes.vat_title')}</h2>
              <div className="flex flex-wrap gap-3">
                {isTaxTemplatesFetching ? (
                  <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {t('table.loading')}
                  </div>
                ) : vatTemplates.length === 0 ? (
                  <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {t('onboarding.empty.taxes')}
                  </div>
                ) : (
                  vatTemplates.map((tax) => {
                    const selected = Boolean(
                      tax.id && form.selectedTaxTemplateIds.includes(tax.id)
                    );
                    return (
                      <button
                        key={tax.id}
                        type="button"
                        onClick={() => toggleTaxTemplate(tax.id)}
                        className={cn(
                          'relative h-11 min-w-28 rounded-md border px-4 font-medium transition-colors hover:border-primary',
                          selected && 'border-primary bg-primary/10'
                        )}
                      >
                        {tax.value ?? 0}%
                        {selected && (
                          <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <h2 className="mb-2 font-medium">{t('onboarding.taxes.extra_title')}</h2>
              <div className="flex flex-wrap gap-3">
                {isTaxTemplatesFetching ? (
                  <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {t('table.loading')}
                  </div>
                ) : additionalTaxTemplates.length === 0 ? (
                  <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {t('onboarding.empty.taxes')}
                  </div>
                ) : (
                  additionalTaxTemplates.map((tax) => {
                    const selected = Boolean(
                      tax.id && form.selectedTaxTemplateIds.includes(tax.id)
                    );
                    return (
                      <button
                        key={tax.id}
                        type="button"
                        onClick={() => toggleTaxTemplate(tax.id)}
                        className={cn(
                          'relative h-11 min-w-44 rounded-md border px-4 font-medium transition-colors hover:border-primary',
                          selected && 'border-primary bg-primary/10'
                        )}
                      >
                        {tax.label}
                        {selected && (
                          <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goPrevious}
            disabled={step === 0 || isSubmitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('commands.back')}
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={goNext} disabled={!isStepValid || isSubmitting}>
              {t('onboarding.next')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={!isStepValid || isSubmitting}>
              {isSubmitting ? t('onboarding.submitting') : t('onboarding.create_company')}
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}

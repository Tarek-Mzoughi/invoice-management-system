import React from 'react';
import {
  Building2,
  Check,
  ChevronsUpDown,
  ImageIcon,
  MapPin,
  Plus,
  Settings2,
  Stamp,
  Trash2,
  Truck,
  Upload,
  UserRound,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Activity, Address, CabinetInvoiceDisplayType, Country, Currency } from '@/types';
import { CabinetSection } from './CabinetSection';
import { useCabinetManager } from './hooks/useCabinetManager';

interface CabinetEditorContentProps {
  activities?: Activity[];
  countries?: Country[];
  currencies?: Currency[];
  loading?: boolean;
}

const fieldClassName =
  'h-11 rounded-lg border-zinc-200/80 bg-white shadow-sm transition-colors focus-visible:ring-primary/30 dark:border-zinc-800 dark:bg-zinc-950';
const labelClassName = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const longSelectContentClassName = 'max-h-72 overflow-y-auto';

const toSelectValue = (value?: number | null) => (value == null ? '' : String(value));

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  label: string;
  required?: boolean;
}

const FormField = ({ children, className, label, required }: FormFieldProps) => (
  <div className={cn('space-y-2', className)}>
    <Label className={labelClassName}>
      {label}
      {required ? <span className="text-destructive"> *</span> : null}
    </Label>
    {children}
  </div>
);

interface AddressFieldsProps {
  address?: Address;
  countries?: Country[];
  disabled?: boolean;
  onAddressChange: (field: keyof Address, value: string | number) => void;
}

const AddressFields = ({ address, countries = [], disabled, onAddressChange }: AddressFieldsProps) => {
  const { t: tSettings } = useTranslation('settings');
  const { t: tCountry } = useTranslation('country');

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <FormField className="lg:col-span-2" label={tSettings('cabinet.attributes.address')} required>
        <Input
          className={fieldClassName}
          disabled={disabled}
          placeholder={tSettings('cabinet.placeholders.address')}
          value={address?.address || ''}
          onChange={(event) => onAddressChange('address', event.target.value)}
        />
      </FormField>

      <FormField label={tSettings('cabinet.attributes.city')} required>
        <Input
          className={fieldClassName}
          disabled={disabled}
          placeholder={tSettings('cabinet.placeholders.city')}
          value={address?.region || ''}
          onChange={(event) => onAddressChange('region', event.target.value)}
        />
      </FormField>

      <FormField label={tSettings('cabinet.attributes.zip_code')} required>
        <Input
          className={fieldClassName}
          disabled={disabled}
          placeholder={tSettings('cabinet.placeholders.zip_code')}
          value={address?.zipcode || ''}
          onChange={(event) => onAddressChange('zipcode', event.target.value)}
        />
      </FormField>

      <FormField className="lg:col-span-2" label={tSettings('cabinet.attributes.country')}>
        <Select
          value={toSelectValue(address?.countryId)}
          onValueChange={(value) => onAddressChange('countryId', Number(value))}
          disabled={disabled}
        >
          <SelectTrigger className={fieldClassName}>
            <SelectValue placeholder={tSettings('cabinet.placeholders.select_country')} />
          </SelectTrigger>
          <SelectContent className={longSelectContentClassName}>
            {countries.map((country) => (
              <SelectItem key={country.id} value={String(country.id)}>
                {country.alpha2Code ? tCountry(country.alpha2Code) : country.alpha3Code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
};

interface ActivityMultiSelectProps {
  activities?: Activity[];
  disabled?: boolean;
  value?: Activity[];
  onChange: (value: Activity[]) => void;
}

const ActivityMultiSelect = ({
  activities = [],
  disabled,
  value = [],
  onChange
}: ActivityMultiSelectProps) => {
  const { t: tSettings } = useTranslation('settings');
  const [open, setOpen] = React.useState(false);
  const selectedIds = React.useMemo(() => new Set(value.map((activity) => activity.id)), [value]);

  const toggleActivity = React.useCallback(
    (activity: Activity) => {
      if (!activity.id) return;

      const nextValue = selectedIds.has(activity.id)
        ? value.filter((currentActivity) => currentActivity.id !== activity.id)
        : [...value.filter((current) => current.id !== activity.id), activity];

      onChange(nextValue);
    },
    [onChange, selectedIds, value]
  );

  const removeActivity = React.useCallback(
    (activityId?: number) => {
      if (!activityId) return;
      onChange(value.filter((activity) => activity.id !== activityId));
    },
    [onChange, value]
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              fieldClassName,
              'h-11 w-full justify-between gap-2 px-3 font-normal'
            )}
            disabled={disabled}
          >
            <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {value.length > 0
                ? tSettings('cabinet.placeholders.activities_selected', { count: value.length })
                : tSettings('cabinet.placeholders.select_activities')}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={tSettings('cabinet.placeholders.search_activity')} />
            <CommandList>
              <CommandEmpty>{tSettings('cabinet.placeholders.no_activity')}</CommandEmpty>
              <CommandGroup>
                {activities.map((activity) => {
                  const isSelected = Boolean(activity.id && selectedIds.has(activity.id));
                  const commandValue = String(activity.id);

                  return (
                    <CommandItem
                      key={activity.id}
                      value={commandValue}
                      keywords={[activity.label || '']}
                      onSelect={() => toggleActivity(activity)}
                    >
                      <Check
                        className={cn('mr-2 size-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                      <span className="truncate">{activity.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          {value.map((activity) => (
            <Badge
              key={activity.id}
              variant="secondary"
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-primary/10 bg-white py-1 pl-2 pr-1 text-xs font-medium text-primary shadow-sm dark:bg-zinc-950"
            >
              <span className="max-w-[220px] truncate">{activity.label}</span>
              <button
                type="button"
                className="rounded-sm p-0.5 text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none"
                disabled={disabled}
                aria-label={tSettings('cabinet.placeholders.select_activities')}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  removeActivity(activity.id);
                }}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface CabinetImageUploadProps {
  description?: string;
  disabled?: boolean;
  label: string;
  value?: File;
  variant?: 'preview' | 'dropzone';
  onChange: (value?: File) => void;
}

const CabinetImageUpload = ({
  description,
  disabled,
  label,
  value,
  variant = 'preview',
  onChange
}: CabinetImageUploadProps) => {
  const { t: tSettings } = useTranslation('settings');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (!value) {
      setPreviewUrl('');
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(value);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className={labelClassName}>{label}</Label>
        {description ? (
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        disabled={disabled}
        onChange={(event) => onChange(event.target.files?.[0])}
      />

      <div
        className={cn(
          'rounded-xl border transition-all',
          variant === 'preview'
            ? 'border-zinc-200/80 bg-gradient-to-b from-zinc-50/80 to-white p-4 dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950'
            : 'border-dashed border-zinc-300/90 bg-zinc-50/30 p-5 hover:border-primary/40 hover:bg-primary/[0.02] dark:border-zinc-700 dark:bg-zinc-900/20 dark:hover:border-primary/30'
        )}
      >
        {previewUrl ? (
          <div
            className={cn(
              'overflow-hidden rounded-lg border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950',
              variant === 'preview'
                ? 'mx-auto flex h-52 w-52 items-center justify-center p-3'
                : 'flex h-44 items-center justify-center p-3'
            )}
          >
            <img src={previewUrl} alt={label} className="max-h-full max-w-full rounded-md object-contain" />
          </div>
        ) : (
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400',
              variant === 'preview'
                ? 'h-52 rounded-lg border border-dashed border-zinc-300/90 dark:border-zinc-700'
                : 'h-44'
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-5" />
            </span>
            <p className="max-w-[260px] text-center text-sm">
              {tSettings('cabinet.actions.choose_image')}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon className="mr-2 size-4" />
            {tSettings('cabinet.actions.choose_image')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-lg text-zinc-600"
            disabled={disabled || !value}
            onClick={() => onChange(undefined)}
          >
            <X className="mr-2 size-4" />
            {tSettings('cabinet.actions.remove_image')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CabinetEditorContent = ({
  activities = [],
  countries = [],
  currencies = [],
  loading
}: CabinetEditorContentProps) => {
  const cabinetManager = useCabinetManager();
  const { t: tSettings } = useTranslation('settings');
  const { t: tCountry } = useTranslation('country');

  const setAddressField = React.useCallback(
    (target: 'invoicingAddress' | 'deliveryAddress', field: keyof Address, value: string | number) => {
      const currentAddress = cabinetManager[target] || {};
      const nextAddress = {
        ...currentAddress,
        [field]: value
      };

      cabinetManager.set(target, nextAddress);
      if (target === 'invoicingAddress') {
        cabinetManager.set('address', nextAddress);
      }
    },
    [cabinetManager]
  );

  const phoneRows = cabinetManager.phoneNumbers.length > 0 ? cabinetManager.phoneNumbers : [''];

  return (
    <div className="grid gap-5">
      <CabinetSection
        icon={Building2}
        title={tSettings('cabinet.sections.basic_information')}
        description={tSettings('cabinet.section_descriptions.basic_information')}
      >
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-5">
            <FormField label={tSettings('cabinet.attributes.enterprise_name')} required>
              <Input
                className={fieldClassName}
                disabled={loading}
                placeholder={tSettings('cabinet.placeholders.enterprise_name')}
                value={cabinetManager.enterpriseName || ''}
                onChange={(event) => cabinetManager.set('enterpriseName', event.target.value)}
              />
            </FormField>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label={tSettings('cabinet.attributes.type')}>
                <Select
                  value={cabinetManager.isPerson ? 'person' : 'company'}
                  onValueChange={(value) => cabinetManager.set('isPerson', value === 'person')}
                  disabled={loading}
                >
                  <SelectTrigger className={fieldClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {tSettings('cabinet.options.company')}
                      </span>
                    </SelectItem>
                    <SelectItem value="person">
                      <span className="flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        {tSettings('cabinet.options.person')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={tSettings('cabinet.attributes.activity_types')}>
                <ActivityMultiSelect
                  activities={activities}
                  disabled={loading}
                  value={cabinetManager.activities}
                  onChange={(value) => {
                    cabinetManager.set('activities', value);
                    cabinetManager.set('activity', value[0]);
                  }}
                />
              </FormField>
            </div>

            {!cabinetManager.isPerson ? (
              <FormField label={tSettings('cabinet.attributes.tax_number')} required>
                <Input
                  className={fieldClassName}
                  disabled={loading}
                  placeholder={tSettings('cabinet.placeholders.tax_number')}
                  value={cabinetManager.taxIdNumber || ''}
                  onChange={(event) => cabinetManager.set('taxIdNumber', event.target.value)}
                />
              </FormField>
            ) : null}
          </div>

          <CabinetImageUpload
            label={tSettings('cabinet.attributes.logo')}
            value={cabinetManager.logo}
            disabled={loading}
            onChange={(value) => cabinetManager.set('logo', value)}
          />
        </div>
      </CabinetSection>

      <CabinetSection
        icon={MapPin}
        title={tSettings('cabinet.sections.contact_information')}
        description={tSettings('cabinet.section_descriptions.contact_information')}
      >
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={tSettings('cabinet.attributes.email')} required>
              <Input
                className={fieldClassName}
                disabled={loading}
                placeholder={tSettings('cabinet.placeholders.email')}
                value={cabinetManager.email || ''}
                onChange={(event) => cabinetManager.set('email', event.target.value)}
              />
            </FormField>

            <FormField label={tSettings('cabinet.attributes.website')}>
              <Input
                className={fieldClassName}
                disabled={loading}
                placeholder={tSettings('cabinet.placeholders.website')}
                value={cabinetManager.website || ''}
                onChange={(event) => cabinetManager.set('website', event.target.value)}
              />
            </FormField>
          </div>

          <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Label className={cn(labelClassName, 'text-base')}>
                {tSettings('cabinet.attributes.phone_numbers')}
              </Label>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg"
                disabled={loading}
                onClick={() =>
                  cabinetManager.set('phoneNumbers', [...cabinetManager.phoneNumbers, ''])
                }
              >
                <Plus className="h-4 w-4" />
                {tSettings('cabinet.actions.add_phone')}
              </Button>
            </div>

            <div className="space-y-3">
              {phoneRows.map((phone, index) => (
                <div key={index} className="flex gap-3">
                  <PhoneInput
                    className="w-full"
                    value={phone}
                    onChange={(value) => {
                      const nextPhoneNumbers = [...phoneRows];
                      nextPhoneNumbers[index] = value || '';
                      cabinetManager.set('phoneNumbers', nextPhoneNumbers);
                    }}
                    isPending={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 rounded-lg"
                    disabled={loading || phoneRows.length === 1}
                    onClick={() =>
                      cabinetManager.set(
                        'phoneNumbers',
                        phoneRows.filter((_, currentIndex) => currentIndex !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CabinetSection>

      <CabinetSection
        icon={Settings2}
        title={tSettings('cabinet.sections.preferences')}
        description={tSettings('cabinet.section_descriptions.preferences')}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={tSettings('cabinet.attributes.country')}>
            <Select
              value={toSelectValue(cabinetManager.countryId)}
              onValueChange={(value) => cabinetManager.set('countryId', Number(value))}
              disabled={loading}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={tSettings('cabinet.placeholders.select_country')} />
              </SelectTrigger>
              <SelectContent className={longSelectContentClassName}>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={String(country.id)}>
                    {country.alpha2Code ? tCountry(country.alpha2Code) : country.alpha3Code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={tSettings('cabinet.attributes.currency')}>
            <Select
              value={toSelectValue(cabinetManager.currency?.id)}
              onValueChange={(value) =>
                cabinetManager.set(
                  'currency',
                  currencies.find((currency) => currency.id === Number(value))
                )
              }
              disabled={loading}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={tSettings('cabinet.placeholders.select_currency')} />
              </SelectTrigger>
              <SelectContent className={longSelectContentClassName}>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={String(currency.id)}>
                    {currency.code} - {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="mt-5 max-w-sm">
          <FormField label={tSettings('cabinet.attributes.invoice_display_type')} required>
            <Select
              value={cabinetManager.invoiceDisplayType || 'invoice'}
              onValueChange={(value) =>
                cabinetManager.set('invoiceDisplayType', value as CabinetInvoiceDisplayType)
              }
              disabled={loading}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">{tSettings('cabinet.options.invoice')}</SelectItem>
                <SelectItem value="honorary_note">
                  {tSettings('cabinet.options.honorary_note')}
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </CabinetSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <CabinetSection
          icon={MapPin}
          title={tSettings('cabinet.sections.billing_address')}
          description={tSettings('cabinet.section_descriptions.billing_address')}
          className="h-full"
        >
          <AddressFields
            address={cabinetManager.invoicingAddress}
            countries={countries}
            disabled={loading}
            onAddressChange={(field, value) => setAddressField('invoicingAddress', field, value)}
          />
        </CabinetSection>

        <CabinetSection
          icon={Truck}
          title={tSettings('cabinet.sections.delivery_address')}
          description={tSettings('cabinet.section_descriptions.delivery_address')}
          className="h-full"
        >
          <AddressFields
            address={cabinetManager.deliveryAddress}
            countries={countries}
            disabled={loading}
            onAddressChange={(field, value) => setAddressField('deliveryAddress', field, value)}
          />
        </CabinetSection>
      </div>

      <CabinetSection
        icon={Stamp}
        title={tSettings('cabinet.assets')}
        description={tSettings('cabinet.section_descriptions.visual_assets')}
      >
        <div className="grid gap-8 xl:grid-cols-2">
          <CabinetImageUpload
            label={tSettings('cabinet.sections.stamp')}
            description={tSettings('cabinet.descriptions.stamp')}
            value={cabinetManager.stamp}
            disabled={loading}
            variant="dropzone"
            onChange={(value) => cabinetManager.set('stamp', value)}
          />

          <CabinetImageUpload
            label={tSettings('cabinet.sections.signature')}
            description={tSettings('cabinet.descriptions.signature')}
            value={cabinetManager.signature}
            disabled={loading}
            variant="dropzone"
            onChange={(value) => cabinetManager.set('signature', value)}
          />
        </div>
      </CabinetSection>
    </div>
  );
};

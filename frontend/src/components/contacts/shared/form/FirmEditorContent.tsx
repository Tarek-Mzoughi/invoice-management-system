import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  UserRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Activity,
  Address,
  Country,
  Currency,
  PaymentCondition,
  SOCIAL_TITLE
} from '@/types';
import { useFirmStore } from '@/hooks/stores/useFirmStore';
import type { FirmEntityContext } from '@/components/contacts/firm/utils/entity-context';
import { FirmBankAccountsSection } from './FirmBankAccountsSection';

interface FirmEditorContentProps {
  activities?: Activity[];
  currencies?: Currency[];
  countries?: Country[];
  paymentConditions?: PaymentCondition[];
  entity?: FirmEntityContext;
  loading?: boolean;
}

const fieldClassName =
  'h-11 rounded-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950';
const labelClassName = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const sectionTitleClassName = 'text-xl font-semibold text-zinc-950 dark:text-zinc-50';
const sectionDescriptionClassName = 'text-sm text-zinc-500 dark:text-zinc-400';

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
      {required ? ' (*)' : ''}
    </Label>
    {children}
  </div>
);

interface AddressSectionProps {
  address?: Address;
  countries?: Country[];
  disabled?: boolean;
  onAddressChange: (field: keyof Address, value: string | number) => void;
}

const AddressSection = ({ address, countries = [], disabled, onAddressChange }: AddressSectionProps) => {
  const { t: tContact } = useTranslation('contacts');
  const { t: tCountry } = useTranslation('country');

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <FormField className="lg:col-span-2" label={tContact('common.address.address')} required>
        <Input
          className={fieldClassName}
          disabled={disabled}
          placeholder={tContact('firm.placeholders.address')}
          value={address?.address || ''}
          onChange={(event) => onAddressChange('address', event.target.value)}
        />
      </FormField>

      <FormField className="lg:col-span-2" label={tContact('common.address.address2')}>
        <Input
          className={fieldClassName}
          disabled={disabled}
          placeholder={tContact('firm.placeholders.address2')}
          value={address?.address2 || ''}
          onChange={(event) => onAddressChange('address2', event.target.value)}
        />
      </FormField>

      <FormField label={tContact('common.address.region')} required>
        <Input
          className={fieldClassName}
          disabled={disabled}
          placeholder={tContact('firm.placeholders.region')}
          value={address?.region || ''}
          onChange={(event) => onAddressChange('region', event.target.value)}
        />
      </FormField>

      <FormField label={tContact('common.address.zip_code')} required>
        <Input
          className={fieldClassName}
          disabled={disabled}
          inputMode="numeric"
          placeholder={tContact('firm.placeholders.zip_code')}
          value={address?.zipcode || ''}
          onChange={(event) => onAddressChange('zipcode', event.target.value)}
        />
      </FormField>

      <FormField className="lg:col-span-2" label={tContact('common.address.country')}>
        <Select
          value={address?.countryId && address.countryId > 0 ? String(address.countryId) : ''}
          onValueChange={(value) => onAddressChange('countryId', Number(value))}
          disabled={disabled}
        >
          <SelectTrigger className={fieldClassName}>
            <SelectValue placeholder={tContact('common.address.country')} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.id} value={String(country.id)}>
                {country.alpha2Code ? tCountry(country.alpha2Code) : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
};

export const FirmEditorContent = ({
  activities = [],
  currencies = [],
  countries = [],
  paymentConditions = [],
  entity = 'clients',
  loading
}: FirmEditorContentProps) => {
  const firmStore = useFirmStore();
  const { t: tContact } = useTranslation('contacts');
  const { t: tCurrency } = useTranslation('currency');
  const { t: tSocial } = useTranslation('social-title');
  const [isDeliveryOpen, setIsDeliveryOpen] = React.useState(true);

  const setAddressField = React.useCallback(
    (target: 'invoicingAddress' | 'deliveryAddress', field: keyof Address, value: string | number) => {
      const currentAddress = firmStore[target] || {};
      firmStore.set(target, {
        ...currentAddress,
        [field]: value
      });
    },
    [firmStore]
  );

  const copyInvoicingAddress = React.useCallback(() => {
    firmStore.set('deliveryAddress', {
      ...(firmStore.invoicingAddress || {})
    });
  }, [firmStore]);

  const handleTypeChange = React.useCallback(
    (isPerson: boolean) => {
      firmStore.set('isPerson', isPerson);
      if (isPerson) {
        firmStore.set('taxIdNumber', '');
      }
    },
    [firmStore]
  );

  const contextDescription = tContact(`firm.context.${entity}.create_page_description`);

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className={sectionTitleClassName}>{tContact('firm.sections.type')}</h2>
          <p className={sectionDescriptionClassName}>{contextDescription}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              active: !firmStore.isPerson,
              icon: <Building2 className="h-5 w-5" />,
              label: tContact('firm.attributes.entreprise_type'),
              onClick: () => handleTypeChange(false)
            },
            {
              active: !!firmStore.isPerson,
              icon: <UserRound className="h-5 w-5" />,
              label: tContact('firm.attributes.particular_entreprise_type'),
              onClick: () => handleTypeChange(true)
            }
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              className={cn(
                'flex h-14 items-center justify-center gap-3 rounded-md border px-5 text-base font-semibold transition',
                option.active
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700'
              )}
              disabled={loading}
              onClick={option.onClick}
            >
              {option.icon}
              <span>{option.label}</span>
              {option.active && <CheckCircle2 className="ml-auto h-5 w-5" />}
            </button>
          ))}
        </div>
      </section>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <section className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className={sectionTitleClassName}>{tContact('firm.sections.business_information')}</h2>
          </div>

          <FormField label={tContact('firm.attributes.entreprise_name')} required>
            <Input
              className={fieldClassName}
              disabled={loading}
              placeholder={tContact('firm.placeholders.enterprise_name')}
              value={firmStore.enterpriseName || ''}
              onChange={(event) => firmStore.set('enterpriseName', event.target.value)}
            />
          </FormField>

          {!firmStore.isPerson && (
            <FormField label={tContact('firm.attributes.tax_number')} required>
              <Input
                className={fieldClassName}
                disabled={loading}
                placeholder={tContact('firm.placeholders.tax_number')}
                value={firmStore.taxIdNumber || ''}
                onChange={(event) => firmStore.set('taxIdNumber', event.target.value)}
              />
            </FormField>
          )}

          <FormField label={tContact('firm.attributes.website')}>
            <Input
              className={fieldClassName}
              disabled={loading}
              placeholder={tContact('firm.placeholders.website')}
              value={firmStore.website || ''}
              onChange={(event) => firmStore.set('website', event.target.value)}
            />
          </FormField>

          <FormField label={tContact('firm.attributes.phone')}>
            <PhoneInput
              className="w-full"
              defaultCountry="TN"
              disabled={loading}
              isPending={loading}
              placeholder={tContact('firm.placeholders.phone')}
              value={firmStore.entreprisePhone || undefined}
              onChange={(value) => firmStore.set('entreprisePhone', value || '')}
            />
          </FormField>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={tContact('firm.attributes.activity')}>
              <Select
                value={firmStore.activity?.id ? String(firmStore.activity.id) : ''}
                onValueChange={(value) =>
                  firmStore.set('activity', value ? ({ id: Number(value) } as Activity) : undefined)
                }
                disabled={loading}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tContact('firm.attributes.activity')} />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={String(activity.id)}>
                      {activity.label || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={tContact('firm.attributes.currency')}>
              <Select
                value={firmStore.currency?.id ? String(firmStore.currency.id) : ''}
                onValueChange={(value) =>
                  firmStore.set('currency', value ? ({ id: Number(value) } as Currency) : undefined)
                }
                disabled={loading}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tContact('firm.attributes.currency')} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={String(currency.id)}>
                      {currency.code ? `${tCurrency(currency.code)} (${currency.symbol})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label={tContact('firm.attributes.payment_conditions')} required>
            <Select
              value={firmStore.paymentCondition?.id ? String(firmStore.paymentCondition.id) : ''}
              onValueChange={(value) =>
                firmStore.set(
                  'paymentCondition',
                  value ? ({ id: Number(value) } as PaymentCondition) : undefined
                )
              }
              disabled={loading}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={tContact('firm.attributes.payment_conditions')} />
              </SelectTrigger>
              <SelectContent>
                {paymentConditions.map((condition) => (
                  <SelectItem key={condition.id} value={String(condition.id)}>
                    {condition.label || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className={sectionTitleClassName}>{tContact('firm.sections.main_contact')}</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
            <FormField label={tContact('interlocutor.attributes.title')} required>
              <Select
                value={firmStore.title || SOCIAL_TITLE.MR}
                onValueChange={(value) => firmStore.set('title', value)}
                disabled={loading}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tContact('interlocutor.attributes.title')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SOCIAL_TITLE).map((title) => (
                    <SelectItem key={title} value={title}>
                      {tSocial(title)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={tContact('interlocutor.attributes.name')} required>
              <Input
                className={fieldClassName}
                disabled={loading}
                placeholder={tContact('firm.placeholders.name')}
                value={firmStore.name || ''}
                onChange={(event) => firmStore.set('name', event.target.value)}
              />
            </FormField>

            <FormField label={tContact('interlocutor.attributes.surname')} required>
              <Input
                className={fieldClassName}
                disabled={loading}
                placeholder={tContact('firm.placeholders.surname')}
                value={firmStore.surname || ''}
                onChange={(event) => firmStore.set('surname', event.target.value)}
              />
            </FormField>
          </div>

          <FormField label={tContact('interlocutor.attributes.position')}>
            <Input
              className={fieldClassName}
              disabled={loading}
              placeholder={tContact('firm.placeholders.position')}
              value={firmStore.position || ''}
              onChange={(event) => firmStore.set('position', event.target.value)}
            />
          </FormField>

          <FormField label={tContact('interlocutor.attributes.email')}>
            <Input
              className={fieldClassName}
              disabled={loading}
              placeholder={tContact('firm.placeholders.email')}
              type="email"
              value={firmStore.email || ''}
              onChange={(event) => firmStore.set('email', event.target.value)}
            />
          </FormField>

          <FormField label={tContact('interlocutor.attributes.phone')}>
            <PhoneInput
              className="w-full"
              defaultCountry="TN"
              disabled={loading}
              isPending={loading}
              placeholder={tContact('firm.placeholders.phone')}
              value={firmStore.phone || undefined}
              onChange={(value) => firmStore.set('phone', value || '')}
            />
          </FormField>
        </div>
      </section>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className={sectionTitleClassName}>{tContact('firm.sections.invoicing_address')}</h2>
        </div>

        <AddressSection
          address={firmStore.invoicingAddress}
          countries={countries}
          disabled={loading}
          onAddressChange={(field, value) => setAddressField('invoicingAddress', field, value)}
        />
      </section>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <Collapsible open={isDeliveryOpen} onOpenChange={setIsDeliveryOpen}>
        <section className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className={sectionTitleClassName}>{tContact('firm.sections.delivery_address')}</h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={copyInvoicingAddress}
              >
                <Copy className="h-4 w-4" />
                {tContact('firm.commands.copy_invoicing_address')}
              </Button>

              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-10 w-10">
                  {isDeliveryOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent>
            <AddressSection
              address={firmStore.deliveryAddress}
              countries={countries}
              disabled={loading}
              onAddressChange={(field, value) => setAddressField('deliveryAddress', field, value)}
            />
          </CollapsibleContent>
        </section>
      </Collapsible>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <FirmBankAccountsSection currencies={currencies} loading={loading} />

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className={sectionTitleClassName}>{tContact('firm.sections.notes')}</h2>
        </div>

        <Textarea
          className="min-h-[180px] resize-none rounded-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          disabled={loading}
          placeholder={tContact('firm.placeholders.notes')}
          rows={6}
          value={firmStore.notes || ''}
          onChange={(event) => firmStore.set('notes', event.target.value)}
        />
      </section>
    </div>
  );
};

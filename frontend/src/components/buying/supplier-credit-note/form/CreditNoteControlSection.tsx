import React from 'react';
import { api } from '@/api';
import {
  BankAccount,
  Currency,
  DuplicateCreditNoteDto,
  CREDIT_NOTE_STATUS,
  PaymentCreditNoteEntry,
  Quotation,
  Tax,
  TaxWithholding
} from '@/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectShimmer,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fromSequentialObjectToString } from '@/utils/string.utils';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';
import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';
import { CreditNoteActionDialog } from '../dialogs/CreditNoteActionDialog';
import { CreditNoteDuplicateDialog } from '../dialogs/CreditNoteDuplicateDialog';
import { CreditNoteDownloadDialog } from '../dialogs/CreditNoteDownloadDialog';
import { CreditNoteDeleteDialog } from '../dialogs/CreditNoteDeleteDialog';
import { CREDIT_NOTE_LIFECYCLE_ACTIONS } from '@/constants/credit-note.lifecycle';
import { CreditNotePaymentList } from './CreditNotePaymentList';
import { FieldBuilder } from '@/components/shared/form-builder/FieldBuilder';
import { FieldVariant } from '@/components/shared/form-builder/types';
import { useCreditNoteManager } from '../hooks/useCreditNoteManager';
import { useCreditNoteArticleManager } from '../hooks/useCreditNoteArticleManager';
import { useCreditNoteControlManager } from '../hooks/useCreditNoteControlManager';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';

interface CreditNoteLifecycle {
  label: string;
  key: string;
  variant: 'default' | 'outline';
  icon: React.ReactNode;
  onClick?: () => void;
  loading: boolean;
  when: {
    membership: 'IN' | 'OUT';
    set: (CREDIT_NOTE_STATUS | undefined)[];
  };
}

interface CreditNoteControlSectionProps {
  className?: string;
  status?: CREDIT_NOTE_STATUS;
  isDataAltered?: boolean;
  bankAccounts: BankAccount[];
  canReadTreasury?: boolean;
  canReadTaxes?: boolean;
  currencies: Currency[];
  quotations: Quotation[];
  taxes: Tax[];
  payments?: PaymentCreditNoteEntry[];
  taxWithholdings?: TaxWithholding[];
  handleSubmit?: () => void;
  handleSubmitDraft: () => void;
  handleSubmitValidated: () => void;
  handleSubmitSent: () => void;
  reset: () => void;
  loading?: boolean;
  edit?: boolean;
  layout?: 'sidebar' | 'panel' | 'floating' | 'dialog';
  showActions?: boolean;
  showHeaderLabel?: boolean;
  showConfiguration?: boolean;
  showVisibility?: boolean;
  showPayments?: boolean;
  creditNotePathPrefix?: string;
  paymentPathPrefix?: string;
  listPath?: string;
}

export const CreditNoteControlSection = ({
  className,
  status = undefined,
  isDataAltered,
  bankAccounts,
  canReadTreasury = true,
  canReadTaxes = true,
  currencies,
  quotations,
  taxes,
  payments = [],
  taxWithholdings,
  handleSubmit,
  handleSubmitDraft,
  handleSubmitValidated,
  handleSubmitSent,
  reset,
  loading,
  edit = true,
  layout = 'sidebar',
  showActions = true,
  showHeaderLabel = true,
  showConfiguration = true,
  showVisibility = true,
  showPayments = true,
  creditNotePathPrefix = '/buying/avoir-fournisseur',
  paymentPathPrefix = '/payments',
  listPath = '/buying/avoirs-fournisseurs'
}: CreditNoteControlSectionProps) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tCommon } = useTranslation('common');
  const { t: tCurrency } = useTranslation('currency');
  const documentScope =
    creditNotePathPrefix.startsWith('/buying') ||
    paymentPathPrefix.startsWith('/buying') ||
    listPath.startsWith('/buying')
      ? 'buying'
      : 'selling';
  const documentLabels = useScopedDocumentLabels('creditNote', documentScope);

  const creditNoteManager = useCreditNoteManager();
  const controlManager = useCreditNoteControlManager();
  const articleManager = useCreditNoteArticleManager();
  const isPanelLayout = layout === 'panel';
  const isFloatingLayout = layout === 'floating';
  const isDialogLayout = layout === 'dialog';
  const bankAccountPermissionMessage = (
    <PermissionNotice tone="info" i18nKey="rbac.bankingDetailsHidden" compact />
  );

  const [actionDialog, setActionDialog] = React.useState(false);
  const [actionName, setActionName] = React.useState<string>();
  const [action, setAction] = React.useState<() => void>(() => {});
  const [downloadDialog, setDownloadDialog] = React.useState(false);
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  const { mutate: downloadCreditNote, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.creditNote.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('creditNote.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('creditNote.action_download_failure'))
      );
    }
  });

  const { mutate: duplicateCreditNote, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateCreditNoteDto: DuplicateCreditNoteDto) =>
      api.creditNote.duplicate(duplicateCreditNoteDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('creditNote.action_duplicate_success'));
      await router.push(`${creditNotePathPrefix}/${data.id}`);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('creditNote.action_duplicate_failure'))
      );
    }
  });

  const { mutate: removeCreditNote, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.creditNote.remove(id),
    onSuccess: () => {
      toast.success(tInvoicing('creditNote.action_remove_success'));
      router.push(listPath);
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tInvoicing('creditNote.action_remove_failure')));
    }
  });

  const buttonsWithHandlers: CreditNoteLifecycle[] = [
    {
      ...CREDIT_NOTE_LIFECYCLE_ACTIONS.save,
      key: 'save',
      onClick: () => {
        setActionName(tCommon('commands.save'));
        handleSubmit &&
          setAction(() => {
            return () => handleSubmit();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...CREDIT_NOTE_LIFECYCLE_ACTIONS.draft,
      key: 'draft',
      onClick: () => {
        setActionName(tCommon('commands.save'));
        setAction(() => {
          return () => handleSubmitDraft();
        });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...CREDIT_NOTE_LIFECYCLE_ACTIONS.validated,
      key: 'validated',
      onClick: () => {
        setActionName(tCommon('commands.validate'));
        setAction(() => {
          return () => handleSubmitValidated();
        });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...CREDIT_NOTE_LIFECYCLE_ACTIONS.duplicate,
      key: 'duplicate',
      onClick: () => setDuplicateDialog(true),
      loading: false
    },
    {
      ...CREDIT_NOTE_LIFECYCLE_ACTIONS.download,
      key: 'download',
      onClick: () => setDownloadDialog(true),
      loading: false
    },
    {
      ...CREDIT_NOTE_LIFECYCLE_ACTIONS.delete,
      key: 'delete',
      onClick: () => setDeleteDialog(true),
      loading: false
    },
    {
      ...CREDIT_NOTE_LIFECYCLE_ACTIONS.reset,
      key: 'reset',
      onClick: () => {
        setActionName(tCommon('commands.initialize'));
        setAction(() => {
          return () => reset();
        });
        setActionDialog(true);
      },
      loading: false
    }
  ];

  const sequential = fromSequentialObjectToString(creditNoteManager.sequentialNumber);
  const fixedTaxes = taxes.filter((tax) => !tax.isRate);
  const selectedQuotation = quotations.find(
    (quotation) => quotation.id === creditNoteManager.quotationId
  );

  const toggleBankDetails = () => {
    if (!canReadTreasury) return;
    controlManager.set('isBankAccountDetailsHidden', !controlManager.isBankAccountDetailsHidden);
    creditNoteManager.set('bankAccount', null);
  };

  const toggleArticleDescription = () => {
    articleManager.removeArticleDescription();
    controlManager.set('isArticleDescriptionHidden', !controlManager.isArticleDescriptionHidden);
  };

  const toggleCreditNoteAddress = () =>
    controlManager.set('isCreditNoteAddressHidden', !controlManager.isCreditNoteAddressHidden);

  const toggleDeliveryAddress = () =>
    controlManager.set('isDeliveryAddressHidden', !controlManager.isDeliveryAddressHidden);

  const toggleGeneralConditions = () => {
    creditNoteManager.set('generalConditions', '');
    controlManager.set('isGeneralConditionsHidden', !controlManager.isGeneralConditionsHidden);
  };

  const togglePrices = () => {
    controlManager.set('isPricesHidden', !controlManager.isPricesHidden);
  };

  const toggleTaxStamp = () => {
    if (!canReadTaxes) return;
    if (!controlManager.isTaxStampHidden) {
      creditNoteManager.set('taxStampId', null);
    }

    controlManager.set('isTaxStampHidden', !controlManager.isTaxStampHidden);
  };

  const toggleTaxWithholding = () => {
    if (!canReadTaxes) return;
    if (!controlManager.isTaxWithholdingHidden) {
      creditNoteManager.set('taxWithholdingId', null);
    }

    controlManager.set('isTaxWithholdingHidden', !controlManager.isTaxWithholdingHidden);
  };

  const SettingCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );

  const SettingRow = ({
    label,
    hint,
    checked,
    onCheckedChange
  }: {
    label: string;
    hint?: string;
    checked: boolean;
    onCheckedChange: () => void;
  }) => (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
        {hint && <p className="text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  const quotationSelector = edit ? (
    <SelectShimmer isPending={loading}>
      <Select
        onValueChange={(value) => {
          creditNoteManager.set('quotationId', value === 'none' ? undefined : parseInt(value, 10));
        }}
        value={creditNoteManager?.quotationId?.toString() || 'none'}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={tInvoicing('controls.quotation_select_placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            {tInvoicing('creditNote.settings_dialog.quotation_empty')}
          </SelectItem>
          {quotations.map((quotation) => (
            <SelectItem key={quotation.id} value={quotation?.id?.toString() || ''}>
              <span className="font-bold">{quotation.sequential}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SelectShimmer>
  ) : selectedQuotation ? (
    <FieldBuilder
      field={{
        id: 'quotation_ro',
        className: 'font-bold',
        variant: FieldVariant.TEXT,
        props: {
          value: selectedQuotation.sequential,
          disabled: true
        }
      }}
    />
  ) : (
    <Label className="flex items-center gap-2 rounded-md border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <AlertCircle className="h-4 w-4" />
      {tInvoicing('creditNote.settings_dialog.quotation_empty')}
    </Label>
  );

  const bankAccountSelector = !canReadTreasury
    ? bankAccountPermissionMessage
    : !controlManager.isBankAccountDetailsHidden && (
    <>
      {bankAccounts.length === 0 && (
        <Label className="flex items-center gap-2 rounded-md border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <AlertCircle className="h-4 w-4" />
          {tInvoicing('controls.no_bank_accounts')}
        </Label>
      )}

      {bankAccounts.length !== 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {tInvoicing('controls.bank_details')}
          </Label>
          <SelectShimmer isPending={loading}>
            <Select
              onValueChange={(value) =>
                creditNoteManager.set(
                  'bankAccount',
                  bankAccounts.find((account) => account.id === parseInt(value, 10))
                )
              }
              value={creditNoteManager?.bankAccount?.id?.toString() || ''}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tInvoicing('controls.bank_select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account?.id?.toString() || ''}>
                    <span className="font-bold">{account?.name}</span> - (
                    {account?.currency?.code && tCurrency(account?.currency?.code)}(
                    {account?.currency?.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectShimmer>
        </div>
      )}
    </>
  );

  const currencySelector = edit ? (
    <div>
      {currencies.length !== 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {tInvoicing('controls.currency_details')}
          </Label>
          <SelectShimmer isPending={loading}>
            <Select
              onValueChange={(value) => {
                creditNoteManager.set(
                  'currency',
                  currencies.find((currency) => currency.id === parseInt(value, 10))
                );
              }}
              value={creditNoteManager?.currency?.id?.toString() || ''}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tInvoicing('controls.currency_select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency?.id?.toString() || ''}>
                    {currency?.code && tCurrency(currency?.code)} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectShimmer>
        </div>
      )}
    </div>
  ) : (
    <FieldBuilder
      field={{
        id: 'currency_ro',
        className: 'font-bold',
        variant: FieldVariant.TEXT,
        props: {
          value:
            creditNoteManager.currency &&
            `${creditNoteManager.currency?.code && tCurrency(creditNoteManager.currency?.code)} (${creditNoteManager?.currency?.symbol})`,
          disabled: true
        }
      }}
    />
  );

  const taxStampSelector =
    !canReadTaxes ? (
      <PermissionNotice tone="info" i18nKey="rbac.taxesWithholdingDisabled" compact />
    ) : !controlManager.isTaxStampHidden && fixedTaxes.length > 0 ? (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tInvoicing('creditNote.attributes.tax_stamp')}
        </Label>
        <SelectShimmer isPending={loading}>
          <Select
            onValueChange={(value) => creditNoteManager.set('taxStampId', parseInt(value, 10))}
            value={creditNoteManager?.taxStampId?.toString() || ''}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={tInvoicing('creditNote.attributes.tax_stamp')} />
            </SelectTrigger>
            <SelectContent>
              {fixedTaxes.map((tax) => (
                <SelectItem key={tax.id} value={tax?.id?.toString() || ''}>
                  {tax.label} (
                  {tax.value?.toFixed(creditNoteManager.currency?.digitAfterComma || 3) || 0}{' '}
                  {creditNoteManager.currency?.symbol || '$'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SelectShimmer>
      </div>
    ) : null;

  const withholdingSelector =
    !canReadTaxes ? (
      <PermissionNotice tone="info" i18nKey="rbac.taxesWithholdingDisabled" compact />
    ) : !controlManager.isTaxWithholdingHidden && (taxWithholdings?.length || 0) > 0 ? (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tInvoicing('creditNote.attributes.withholding')}
        </Label>
        <SelectShimmer isPending={loading}>
          <Select
            onValueChange={(value) => {
              creditNoteManager.set('taxWithholdingId', parseInt(value, 10));
            }}
            value={creditNoteManager?.taxWithholdingId?.toString() || ''}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={tInvoicing('controls.tax_withholding_select_placeholder')}
              />
            </SelectTrigger>
            <SelectContent>
              {taxWithholdings?.map((taxWithholding) => (
                <SelectItem key={taxWithholding.id} value={taxWithholding?.id?.toString() || ''}>
                  <span className="font-bold">{taxWithholding.label}</span> ({taxWithholding.rate}
                  %)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SelectShimmer>
      </div>
    ) : null;

  const dialogSettingsContent = (
    <div className="space-y-5">
      {showConfiguration && (
        <>
          <SettingCard title={tInvoicing('creditNote.settings_dialog.quotation_section')}>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {tInvoicing('creditNote.settings_dialog.quotation_hint')}
            </p>
            {quotationSelector}
          </SettingCard>

          <SettingCard title={tInvoicing('creditNote.settings_dialog.currency_section')}>
            {currencySelector}
          </SettingCard>

          <SettingCard title={tInvoicing('creditNote.settings_dialog.bank_section')}>
            <SettingRow
              label={tInvoicing('creditNote.settings_dialog.display_bank_details')}
              hint={tInvoicing('creditNote.settings_dialog.display_bank_details_hint')}
              checked={canReadTreasury && !controlManager.isBankAccountDetailsHidden}
              onCheckedChange={toggleBankDetails}
            />
            {bankAccountSelector}
          </SettingCard>

          <SettingCard title={tInvoicing('creditNote.settings_dialog.tax_section')}>
            <SettingRow
              label={tInvoicing('creditNote.settings_dialog.display_tax_stamp')}
              hint={tInvoicing('creditNote.settings_dialog.tax_stamp_hint')}
              checked={canReadTaxes && !controlManager.isTaxStampHidden}
              onCheckedChange={toggleTaxStamp}
            />
            {taxStampSelector}
          </SettingCard>

          <SettingCard title={tInvoicing('creditNote.settings_dialog.withholding_section')}>
            <SettingRow
              label={tInvoicing('creditNote.settings_dialog.display_withholding')}
              hint={tInvoicing('creditNote.settings_dialog.withholding_hint')}
              checked={canReadTaxes && !controlManager.isTaxWithholdingHidden}
              onCheckedChange={toggleTaxWithholding}
            />
            {withholdingSelector}
          </SettingCard>
        </>
      )}

      {showVisibility && (
        <>
          <SettingCard title={tInvoicing('creditNote.settings_dialog.address_section')}>
            <SettingRow
              label={tInvoicing('creditNote.attributes.invoicing_address')}
              hint={tInvoicing('creditNote.settings_dialog.invoicing_address_hint')}
              checked={!controlManager.isCreditNoteAddressHidden}
              onCheckedChange={toggleCreditNoteAddress}
            />
            <SettingRow
              label={tInvoicing('creditNote.attributes.delivery_address')}
              hint={tInvoicing('creditNote.settings_dialog.delivery_address_hint')}
              checked={!controlManager.isDeliveryAddressHidden}
              onCheckedChange={toggleDeliveryAddress}
            />
          </SettingCard>

          <SettingCard title={tInvoicing('creditNote.settings_dialog.content_section')}>
            <SettingRow
              label={tInvoicing('controls.article_description')}
              hint={tInvoicing('creditNote.settings_dialog.article_description_hint')}
              checked={!controlManager.isArticleDescriptionHidden}
              onCheckedChange={toggleArticleDescription}
            />
            <SettingRow
              label={tInvoicing('creditNote.settings_dialog.display_prices')}
              hint={tInvoicing('creditNote.settings_dialog.display_prices_hint')}
              checked={!controlManager.isPricesHidden}
              onCheckedChange={togglePrices}
            />
            <SettingRow
              label={tInvoicing('creditNote.attributes.general_condition')}
              hint={tInvoicing('creditNote.settings_dialog.general_conditions_hint')}
              checked={!controlManager.isGeneralConditionsHidden}
              onCheckedChange={toggleGeneralConditions}
            />
          </SettingCard>
        </>
      )}
    </div>
  );

  return (
    <>
      <CreditNoteActionDialog
        id={creditNoteManager?.id || 0}
        sequential={sequential}
        action={actionName}
        open={actionDialog}
        callback={action}
        isCallbackPending={loading}
        onClose={() => setActionDialog(false)}
      />
      <CreditNoteDuplicateDialog
        id={creditNoteManager?.id || 0}
        sequential={sequential}
        open={duplicateDialog}
        duplicateCreditNote={(includeFiles: boolean) => {
          creditNoteManager?.id &&
            duplicateCreditNote({
              id: creditNoteManager.id,
              includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />
      <CreditNoteDownloadDialog
        id={creditNoteManager?.id || 0}
        open={downloadDialog}
        downloadCreditNote={(template: string) => {
          creditNoteManager?.id && downloadCreditNote({ id: creditNoteManager.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />
      <CreditNoteDeleteDialog
        id={creditNoteManager?.id || 0}
        sequential={fromSequentialObjectToString(creditNoteManager?.sequentialNumber)}
        open={deleteDialog}
        deleteCreditNote={() => {
          creditNoteManager?.id && removeCreditNote(creditNoteManager.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />

      <div className={cn(className, (isPanelLayout || isDialogLayout) && 'space-y-5')}>
        {showActions && (
          <div
            className={cn(
              'w-full',
              !isFloatingLayout && 'border-b border-zinc-200 pb-5 dark:border-zinc-800',
              isPanelLayout
                ? 'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'
                : isFloatingLayout
                  ? 'flex flex-wrap items-center justify-end gap-2'
                  : 'flex flex-col gap-2'
            )}
          >
            {showHeaderLabel && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {documentLabels.singular}
                </p>
                {status && (
                  <Label className={cn(isPanelLayout ? 'text-sm' : 'text-base my-2 text-center')}>
                    <span className="font-bold">
                      {tInvoicing('creditNote.attributes.status')} :
                    </span>
                    <span className="ml-2 mr-1 font-extrabold text-gray-500">
                      {tInvoicing(status)}
                    </span>
                  </Label>
                )}
                {!status && isPanelLayout && (
                  <p className="text-sm text-muted-foreground">{tCommon('commands.actions')}</p>
                )}
              </div>
            )}

            <div
              className={cn(
                isPanelLayout
                  ? 'flex flex-wrap items-center gap-2 lg:justify-end'
                  : isFloatingLayout
                    ? 'flex flex-wrap items-center justify-end gap-2'
                    : 'flex flex-col gap-2'
              )}
            >
              {buttonsWithHandlers.map((lifecycle) => {
                const isDisplayed = lifecycle.when.set.includes(status);
                const display = lifecycle.when.membership === 'IN' ? isDisplayed : !isDisplayed;
                const disabled =
                  isDataAltered && (lifecycle.key === 'save' || lifecycle.key === 'reset');
                const buttonVariant =
                  (isPanelLayout || isFloatingLayout) &&
                  !['save', 'validated'].includes(lifecycle.key)
                    ? 'outline'
                    : lifecycle.variant;

                return (
                  display && (
                    <Button
                      disabled={disabled}
                      variant={buttonVariant}
                      size={isPanelLayout || isFloatingLayout ? 'sm' : 'default'}
                      key={lifecycle.key}
                      className="flex items-center"
                      onClick={lifecycle.onClick}
                    >
                      {lifecycle.icon}
                      <span className="mx-1">{tCommon(lifecycle.label)}</span>
                      <Spinner className="ml-2" size="small" show={lifecycle.loading} />
                    </Button>
                  )
                );
              })}
            </div>
          </div>
        )}

        {showPayments &&
          !isDialogLayout &&
          !isFloatingLayout &&
          status &&
          [
            CREDIT_NOTE_STATUS.Unpaid,
            CREDIT_NOTE_STATUS.Paid,
            CREDIT_NOTE_STATUS.PartiallyPaid
          ].includes(status) &&
          payments.length !== 0 && (
            <CreditNotePaymentList
              className="border-b border-zinc-200 pb-5 dark:border-zinc-800"
              payments={payments}
              currencies={currencies}
              paymentPathPrefix={paymentPathPrefix}
            />
          )}

        {!isFloatingLayout && (showConfiguration || showVisibility) && dialogSettingsContent}
      </div>
    </>
  );
};

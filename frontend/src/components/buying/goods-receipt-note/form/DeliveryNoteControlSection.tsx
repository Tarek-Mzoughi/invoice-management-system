import React from 'react';
import { api } from '@/api';
import {
  BankAccount,
  Currency,
  DuplicateDeliveryNoteDto,
  Invoice,
  DELIVERY_NOTE_STATUS
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
import { useDeliveryNoteManager } from '@/components/buying/goods-receipt-note/hooks/useDeliveryNoteManager';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fromSequentialObjectToString } from '@/utils/string.utils';
import { DeliveryNoteDuplicateDialog } from '../dialogs/DeliveryNoteDuplicateDialog';
import { DeliveryNoteDownloadDialog } from '../dialogs/DeliveryNoteDownloadDialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';
import { useRouter } from 'next/router';
import { DeliveryNoteDeleteDialog } from '../dialogs/DeliveryNoteDeleteDialog';
import { useDeliveryNoteControlManager } from '../hooks/useDeliveryNoteControlManager';
import { DeliveryNoteActionDialog } from '../dialogs/DeliveryNoteActionDialog';
import { useDeliveryNoteArticleManager } from '../hooks/useDeliveryNoteArticleManager';
import { DELIVERY_NOTE_LIFECYCLE_ACTIONS } from '@/constants/delivery-note.lifecycle';
import { DeliveryNoteInvoiceDialog } from '../dialogs/DeliveryNoteInvoiceDialog';
import { DeliveryNoteInvoiceList } from './DeliveryNoteInvoiceList';
import { FieldBuilder } from '@/components/shared/form-builder/FieldBuilder';
import { FieldVariant } from '@/components/shared/form-builder/types';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';

interface DeliveryNoteLifecycle {
  label: string;
  key: string;
  variant: 'default' | 'outline';
  icon: React.ReactNode;
  onClick?: () => void;
  loading: boolean;
  when: {
    membership: 'IN' | 'OUT';
    set: (DELIVERY_NOTE_STATUS | undefined)[];
  };
}

interface DeliveryNoteControlSectionProps {
  className?: string;
  status?: DELIVERY_NOTE_STATUS;
  isDataAltered?: boolean;
  bankAccounts: BankAccount[];
  canReadTreasury?: boolean;
  currencies: Currency[];
  invoices: Invoice[];
  handleSubmit?: () => void;
  handleSubmitDraft: () => void;
  handleSubmitCreated?: () => void;
  handleSubmitDelivered?: () => void;
  handleSubmitCancelled?: () => void;
  reset: () => void;
  refetch?: () => void;
  loading?: boolean;
  edit?: boolean;
  layout?: 'sidebar' | 'panel' | 'floating' | 'dialog';
  showActions?: boolean;
  showHeaderLabel?: boolean;
  showConfiguration?: boolean;
  showVisibility?: boolean;
  showInvoices?: boolean;
  allowInvoiceAction?: boolean;
  deliveryNotePathPrefix?: string;
  detailPathPrefix?: string;
  listPath?: string;
}

export const DeliveryNoteControlSection = ({
  className,
  status = undefined,
  isDataAltered,
  bankAccounts,
  canReadTreasury = true,
  currencies,
  invoices,
  handleSubmit,
  handleSubmitDraft,
  handleSubmitCreated,
  handleSubmitDelivered,
  handleSubmitCancelled,
  reset,
  refetch,
  loading,
  edit = true,
  layout = 'sidebar',
  showActions = true,
  showHeaderLabel = true,
  showConfiguration = true,
  showVisibility = true,
  showInvoices = true,
  allowInvoiceAction = true,
  deliveryNotePathPrefix = '/buying/bon-reception',
  detailPathPrefix = '/buying/facture-achat',
  listPath = '/buying/bons-reception'
}: DeliveryNoteControlSectionProps) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tCommon } = useTranslation('common');
  const { t: tCurrency } = useTranslation('currency');
  const documentScope =
    deliveryNotePathPrefix.startsWith('/buying') ||
    detailPathPrefix.startsWith('/buying') ||
    listPath.startsWith('/buying')
      ? 'buying'
      : 'selling';
  const documentLabels = useScopedDocumentLabels('deliveryNote', documentScope);

  const deliveryNoteManager = useDeliveryNoteManager();
  const controlManager = useDeliveryNoteControlManager();
  const articleManager = useDeliveryNoteArticleManager();
  const isPanelLayout = layout === 'panel';
  const isFloatingLayout = layout === 'floating';
  const isDialogLayout = layout === 'dialog';
  const bankAccountPermissionMessage = (
    <PermissionNotice tone="info" i18nKey="rbac.bankingDetailsHidden" compact />
  );

  //action dialog
  const [actionDialog, setActionDialog] = React.useState<boolean>(false);
  const [actionName, setActionName] = React.useState<string>();
  const [action, setAction] = React.useState<() => void>(() => {});

  //download dialog
  const [downloadDialog, setDownloadDialog] = React.useState(false);

  //Download DeliveryNote
  const { mutate: downloadDeliveryNote, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.deliveryNote.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('deliveryNote.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_download_failure'))
      );
    }
  });

  //duplicate dialog
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);

  //Duplicate DeliveryNote
  const { mutate: duplicateDeliveryNote, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateDeliveryNoteDto: DuplicateDeliveryNoteDto) =>
      api.deliveryNote.duplicate(duplicateDeliveryNoteDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('deliveryNote.action_duplicate_success'));
      await router.push(`${deliveryNotePathPrefix}/${data.id}`);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_duplicate_failure'))
      );
    }
  });

  //delete dialog
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  //Delete DeliveryNote
  const { mutate: removeDeliveryNote, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.deliveryNote.remove(id),
    onSuccess: () => {
      toast.success(tInvoicing('deliveryNote.action_remove_success'));
      router.push(listPath);
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tInvoicing('deliveryNote.action_remove_failure')));
    }
  });

  //invoice dialog
  const [invoiceDialog, setInvoiceDialog] = React.useState(false);

  //Invoice deliveryNote
  const { mutate: invoiceDeliveryNote, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.deliveryNote.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success(tInvoicing('deliveryNote.action_invoice_success'));
      refetch?.();
      router.push(`${detailPathPrefix}/${data.invoices[data?.invoices?.length - 1].id}`);
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('deliveryNote.action_invoice_failure')
      );
      toast.error(message);
    }
  });

  const buttonsWithHandlers: DeliveryNoteLifecycle[] = [
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.save,
      key: 'save',
      onClick: () => {
        setActionName(tCommon('commands.save'));
        !!handleSubmit &&
          setAction(() => {
            return () => handleSubmit();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.draft,
      key: 'draft',
      onClick: () => {
        setActionName(tCommon('commands.save'));
        !!handleSubmitDraft &&
          setAction(() => {
            return () => handleSubmitDraft();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.created,
      key: 'created',
      onClick: () => {
        setActionName(tCommon('commands.validate'));
        !!handleSubmitCreated &&
          setAction(() => {
            return () => handleSubmitCreated();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.delivered,
      key: 'delivered',
      onClick: () => {
        setActionName(tCommon('commands.deliver'));
        !!handleSubmitDelivered &&
          setAction(() => {
            return () => handleSubmitDelivered();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.cancel,
      key: 'cancel',
      onClick: () => {
        setActionName(tCommon('commands.cancel'));
        !!handleSubmitCancelled &&
          setAction(() => {
            return () => handleSubmitCancelled();
          });
        setActionDialog(true);
      },
      loading: false
    },
    ...(allowInvoiceAction
      ? [
          {
            ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.invoiced,
            key: 'to_invoice',
            onClick: () => {
              setInvoiceDialog(true);
            },
            loading: false
          } as DeliveryNoteLifecycle
        ]
      : []),
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.duplicate,
      key: 'duplicate',
      onClick: () => {
        setDuplicateDialog(true);
      },
      loading: false
    },
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.download,
      key: 'download',
      onClick: () => setDownloadDialog(true),
      loading: false
    },
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.delete,
      key: 'delete',
      onClick: () => {
        setDeleteDialog(true);
      },
      loading: false
    },
    {
      ...DELIVERY_NOTE_LIFECYCLE_ACTIONS.reset,
      key: 'reset',
      onClick: () => {
        setActionName(tCommon('commands.initialize'));
        !!reset &&
          setAction(() => {
            return () => reset();
          });
        setActionDialog(true);
      },
      loading: false
    }
  ];
  const sequential = fromSequentialObjectToString(deliveryNoteManager.sequentialNumber);
  const toggleBankDetails = () => {
    if (!canReadTreasury) return;
    controlManager.set('isBankAccountDetailsHidden', !controlManager.isBankAccountDetailsHidden);
    deliveryNoteManager.set('bankAccount', null);
  };
  const toggleArticleDescription = () => {
    articleManager.removeArticleDescription();
    controlManager.set('isArticleDescriptionHidden', !controlManager.isArticleDescriptionHidden);
  };
  const toggleInvoiceAddress = () =>
    controlManager.set('isInvoiceAddressHidden', !controlManager.isInvoiceAddressHidden);
  const toggleDeliveryAddress = () =>
    controlManager.set('isDeliveryAddressHidden', !controlManager.isDeliveryAddressHidden);
  const toggleGeneralConditions = () => {
    deliveryNoteManager.set('generalConditions', '');
    controlManager.set('isGeneralConditionsHidden', !controlManager.isGeneralConditionsHidden);
  };
  const togglePrices = () => controlManager.set('isPricesHidden', !controlManager.isPricesHidden);

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

  const includeSection = (
    <div
      className={cn(
        isPanelLayout
          ? 'border-t border-zinc-200 pt-5 dark:border-zinc-800 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0'
          : isFloatingLayout
            ? ''
            : 'w-full py-5'
      )}
    >
      <h1 className="font-bold">{tInvoicing('controls.include_on_deliveryNote')}</h1>
      <div className="flex w-full items-center mt-1">
        <Label className="w-full">{tInvoicing('controls.bank_details')}</Label>
        <div className="w-full m-1 text-right">
          <Switch
            onCheckedChange={toggleBankDetails}
            {...{ checked: canReadTreasury && !controlManager.isBankAccountDetailsHidden }}
          />
        </div>
      </div>
      <div className="flex w-full items-center mt-1">
        <Label className="w-full">{tInvoicing('controls.article_description')}</Label>
        <div className="w-full m-1 text-right">
          <Switch
            onCheckedChange={toggleArticleDescription}
            {...{ checked: !controlManager.isArticleDescriptionHidden }}
          />
        </div>
      </div>
      <div className="flex w-full items-center mt-1">
        <Label className="w-full">{tInvoicing('deliveryNote.attributes.invoicing_address')}</Label>
        <div className="w-full m-1 text-right">
          <Switch
            onCheckedChange={toggleInvoiceAddress}
            {...{ checked: !controlManager.isInvoiceAddressHidden }}
          />
        </div>
      </div>
      <div className="flex w-full items-center mt-1">
        <Label className="w-full">{tInvoicing('deliveryNote.attributes.delivery_address')}</Label>
        <div className="w-full m-1 text-right">
          <Switch
            onCheckedChange={toggleDeliveryAddress}
            {...{ checked: !controlManager.isDeliveryAddressHidden }}
          />
        </div>
      </div>
      <div className="flex w-full items-center mt-1">
        <Label className="w-full">{tInvoicing('deliveryNote.attributes.general_condition')}</Label>
        <div className="w-full m-1 text-right">
          <Switch
            onCheckedChange={toggleGeneralConditions}
            {...{ checked: !controlManager.isGeneralConditionsHidden }}
          />
        </div>
      </div>
      <div className="flex w-full items-center mt-1">
        <Label className="w-full">
          {tInvoicing('deliveryNote.settings_dialog.display_prices')}
        </Label>
        <div className="w-full m-1 text-right">
          <Switch onCheckedChange={togglePrices} {...{ checked: !controlManager.isPricesHidden }} />
        </div>
      </div>
    </div>
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
              onValueChange={(e) =>
                deliveryNoteManager.set(
                  'bankAccount',
                  bankAccounts.find((account) => account.id == parseInt(e))
                )
              }
              value={deliveryNoteManager?.bankAccount?.id?.toString() || ''}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tInvoicing('controls.bank_select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts?.map((account: BankAccount) => {
                  return (
                    <SelectItem key={account.id} value={account?.id?.toString() || ''}>
                      <span className="font-bold">{account?.name}</span> - (
                      {account?.currency?.code && tCurrency(account?.currency?.code)}(
                      {account?.currency?.symbol})
                    </SelectItem>
                  );
                })}
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
              onValueChange={(e) => {
                deliveryNoteManager.set(
                  'currency',
                  currencies.find((currency) => currency.id == parseInt(e))
                );
              }}
              value={deliveryNoteManager?.currency?.id?.toString() || ''}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tInvoicing('controls.currency_select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency: Currency) => {
                  return (
                    <SelectItem key={currency.id} value={currency?.id?.toString() || ''}>
                      {currency?.code && tCurrency(currency?.code)} ({currency.symbol})
                    </SelectItem>
                  );
                })}
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
            deliveryNoteManager.currency &&
            `${deliveryNoteManager.currency?.code && tCurrency(deliveryNoteManager.currency?.code)} (${deliveryNoteManager?.currency?.symbol})`,
          disabled: true
        }
      }}
    />
  );

  const dialogSettingsContent = (
    <div className="space-y-5">
      {showConfiguration && (
        <>
          <SettingCard title={tInvoicing('deliveryNote.settings_dialog.currency_section')}>
            {currencySelector}
          </SettingCard>

          <SettingCard title={tInvoicing('deliveryNote.settings_dialog.bank_section')}>
            <SettingRow
              label={tInvoicing('deliveryNote.settings_dialog.display_bank_details')}
              hint={tInvoicing('deliveryNote.settings_dialog.display_bank_details_hint')}
              checked={canReadTreasury && !controlManager.isBankAccountDetailsHidden}
              onCheckedChange={toggleBankDetails}
            />
            {bankAccountSelector}
          </SettingCard>
        </>
      )}

      {showVisibility && (
        <>
          <SettingCard title={tInvoicing('deliveryNote.settings_dialog.address_section')}>
            <SettingRow
              label={tInvoicing('deliveryNote.attributes.invoicing_address')}
              hint={tInvoicing('deliveryNote.settings_dialog.invoicing_address_hint')}
              checked={!controlManager.isInvoiceAddressHidden}
              onCheckedChange={toggleInvoiceAddress}
            />
            <SettingRow
              label={tInvoicing('deliveryNote.attributes.delivery_address')}
              hint={tInvoicing('deliveryNote.settings_dialog.delivery_address_hint')}
              checked={!controlManager.isDeliveryAddressHidden}
              onCheckedChange={toggleDeliveryAddress}
            />
          </SettingCard>

          <SettingCard title={tInvoicing('deliveryNote.settings_dialog.content_section')}>
            <SettingRow
              label={tInvoicing('controls.article_description')}
              hint={tInvoicing('deliveryNote.settings_dialog.article_description_hint')}
              checked={!controlManager.isArticleDescriptionHidden}
              onCheckedChange={toggleArticleDescription}
            />
            <SettingRow
              label={tInvoicing('deliveryNote.settings_dialog.display_prices')}
              hint={tInvoicing('deliveryNote.settings_dialog.display_prices_hint')}
              checked={!controlManager.isPricesHidden}
              onCheckedChange={togglePrices}
            />
            <SettingRow
              label={tInvoicing('deliveryNote.attributes.general_condition')}
              hint={tInvoicing('deliveryNote.settings_dialog.general_conditions_hint')}
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
      <DeliveryNoteActionDialog
        id={deliveryNoteManager?.id || 0}
        sequential={sequential}
        action={actionName}
        open={actionDialog}
        callback={action}
        isCallbackPending={loading}
        onClose={() => setActionDialog(false)}
      />
      <DeliveryNoteDuplicateDialog
        id={deliveryNoteManager?.id || 0}
        sequential={sequential}
        open={duplicateDialog}
        duplicateDeliveryNote={(includeFiles: boolean) => {
          deliveryNoteManager?.id &&
            duplicateDeliveryNote({
              id: deliveryNoteManager?.id,
              includeFiles: includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />
      <DeliveryNoteDownloadDialog
        id={deliveryNoteManager?.id || 0}
        open={downloadDialog}
        downloadDeliveryNote={(template: string) => {
          deliveryNoteManager?.id &&
            downloadDeliveryNote({ id: deliveryNoteManager?.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />
      <DeliveryNoteDeleteDialog
        id={deliveryNoteManager?.id || 0}
        sequential={sequential}
        open={deleteDialog}
        deleteDeliveryNote={() => {
          deliveryNoteManager?.id && removeDeliveryNote(deliveryNoteManager?.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
      {allowInvoiceAction && (
        <DeliveryNoteInvoiceDialog
          id={deliveryNoteManager?.id || 0}
          status={deliveryNoteManager?.status}
          sequential={sequential}
          open={invoiceDialog}
          isInvoicePending={isInvoicingPending}
          invoice={(id: number, createInvoice: boolean) => {
            invoiceDeliveryNote({ id, createInvoice });
          }}
          onClose={() => setInvoiceDialog(false)}
        />
      )}
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
                      {tInvoicing('deliveryNote.attributes.status')} :
                    </span>
                    <span className="ml-2 mr-1 font-extrabold text-gray-500">
                      {tInvoicing(status)}
                    </span>
                    {status === DELIVERY_NOTE_STATUS.Delivered && invoices?.length != 0 && (
                      <span className="font-extrabold text-gray-500">({invoices?.length})</span>
                    )}
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
              {buttonsWithHandlers.map((lifecycle: DeliveryNoteLifecycle) => {
                const idisplay = lifecycle.when?.set?.includes(status);
                const display = lifecycle.when?.membership == 'IN' ? idisplay : !idisplay;
                const disabled =
                  isDataAltered && (lifecycle.key === 'save' || lifecycle.key === 'reset');
                const buttonVariant =
                  (isPanelLayout || isFloatingLayout) &&
                  !['save', 'created', 'delivered'].includes(lifecycle.key)
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
                      <Spinner className="ml-2" size={'small'} show={lifecycle.loading} />
                    </Button>
                  )
                );
              })}
            </div>
          </div>
        )}
        {/* Invoice list */}
        {showInvoices && status === DELIVERY_NOTE_STATUS.Delivered && invoices.length != 0 && (
          <DeliveryNoteInvoiceList
            className="border-b"
            invoices={invoices}
            detailPathPrefix={detailPathPrefix}
          />
        )}
        {isDialogLayout ? (
          dialogSettingsContent
        ) : (
          <>
            {showConfiguration && (
              <div
                className={cn(
                  'w-full',
                  isPanelLayout
                    ? 'grid gap-6 border-b border-zinc-200 py-5 dark:border-zinc-800 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]'
                    : 'mt-5 border-b'
                )}
              >
                <div>
                  {!canReadTreasury && bankAccountPermissionMessage}
                  {canReadTreasury && !controlManager.isBankAccountDetailsHidden && (
                    <React.Fragment>
                      {bankAccounts.length == 0 && (
                        <div>
                          <h1 className="font-bold">{tInvoicing('controls.bank_details')}</h1>
                          <Label className="flex p-5 items-center justify-center gap-2 underline ">
                            <AlertCircle />
                            {tInvoicing('controls.no_bank_accounts')}
                          </Label>
                        </div>
                      )}
                      {bankAccounts.length != 0 && (
                        <div>
                          <h1 className="font-bold">{tInvoicing('controls.bank_details')}</h1>
                          <div className="my-5">
                            <SelectShimmer isPending={loading}>
                              <Select
                                onValueChange={(e) =>
                                  deliveryNoteManager.set(
                                    'bankAccount',
                                    bankAccounts.find((account) => account.id == parseInt(e))
                                  )
                                }
                                value={deliveryNoteManager?.bankAccount?.id?.toString() || ''}
                              >
                                <SelectTrigger className="mty1 w-full">
                                  <SelectValue
                                    placeholder={tInvoicing('controls.bank_select_placeholder')}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {bankAccounts?.map((account: BankAccount) => {
                                    return (
                                      <SelectItem
                                        key={account.id}
                                        value={account?.id?.toString() || ''}
                                      >
                                        <span className="font-bold">{account?.name}</span> - (
                                        {account?.currency?.code &&
                                          tCurrency(account?.currency?.code)}
                                        ({account?.currency?.symbol})
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </SelectShimmer>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )}
                  <h1 className="font-bold">{tInvoicing('controls.currency_details')}</h1>
                  {edit ? (
                    <div>
                      {currencies.length != 0 && (
                        <div className="my-5">
                          <SelectShimmer isPending={loading}>
                            <Select
                              onValueChange={(e) => {
                                deliveryNoteManager.set(
                                  'currency',
                                  currencies.find((currency) => currency.id == parseInt(e))
                                );
                              }}
                              value={deliveryNoteManager?.currency?.id?.toString() || ''}
                            >
                              <SelectTrigger className="mty1 w-full">
                                <SelectValue
                                  placeholder={tInvoicing('controls.currency_select_placeholder')}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies?.map((currency: Currency) => {
                                  return (
                                    <SelectItem
                                      key={currency.id}
                                      value={currency?.id?.toString() || ''}
                                    >
                                      {currency?.code && tCurrency(currency?.code)} (
                                      {currency.symbol})
                                    </SelectItem>
                                  );
                                })}
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
                        className: 'font-bold my-4',
                        variant: FieldVariant.TEXT,
                        props: {
                          value:
                            deliveryNoteManager.currency &&
                            `${deliveryNoteManager.currency?.code && tCurrency(deliveryNoteManager.currency?.code)} (${deliveryNoteManager?.currency?.symbol})`,
                          disabled: true
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            {showVisibility && isPanelLayout ? includeSection : null}
            {showVisibility && !isPanelLayout && !isFloatingLayout && includeSection}
          </>
        )}
      </div>
    </>
  );
};

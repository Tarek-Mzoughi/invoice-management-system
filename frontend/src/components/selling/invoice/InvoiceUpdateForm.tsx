import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ArticleInvoiceEntry,
  INVOICE_STATUS,
  Invoice,
  InvoiceUploadedFile,
  QUOTATION_STATUS,
  UpdateInvoiceDto
} from '@/types';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useInvoiceManager } from './hooks/useInvoiceManager';
import { useInvoiceArticleManager } from './hooks/useInvoiceArticleManager';
import { useInvoiceControlManager } from './hooks/useInvoiceControlManager';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { InvoiceExtraOptions } from './form/InvoiceExtraOptions';
import { InvoiceGeneralConditions } from './form/InvoiceGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import useQuotationChoices from '@/hooks/content/useQuotationChoice';
import { InvoiceGeneralInformation } from './form/InvoiceGeneralInformation';
import { InvoiceArticleManagement } from './form/InvoiceArticleManagement';
import { InvoiceFinancialInformation } from './form/InvoiceFinancialInformation';
import { InvoiceControlSection } from './form/InvoiceControlSection';
import useTaxWithholding from '@/hooks/content/useTaxWithholding';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import useInvoiceRangeDates from '@/hooks/content/useInvoiceRangeDates';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { InvoiceSettingsDialog } from './dialogs/InvoiceSettingsDialog';
import { InvoicePaymentList } from './form/InvoicePaymentList';
import { Check, ChevronDown, Eye, FileText, Settings2 } from 'lucide-react';
import { useIntro } from '@/context/IntroContext';
import {
  DocumentEditorActionGroup,
  DocumentEditorLead,
  DocumentEditorShell,
  useInitialEditorLoading
} from '@/features/invoicing/shared/editor';
import { DocumentStatusBadge } from '@/features/invoicing/shared/status';
import {
  isStatusEditable,
  INVOICE_EDITABILITY_RULE,
  INVOICE_FORM_STATUS,
  type DocumentEditorActionModel
} from '@/features/invoicing/shared/models';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface InvoiceFormProps {
  className?: string;
  invoiceId: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const InvoiceUpdateForm = ({
  className,
  invoiceId,
  scope = 'selling',
  listPath = '/selling/invoices'
}: InvoiceFormProps) => {
  const router = useRouter();
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const invoiceManager = useInvoiceManager();
  const controlManager = useInvoiceControlManager();
  const articleManager = useInvoiceArticleManager();
  const activityType = ACTIVITY_TYPE.SELLING;
  const isBuying = false;
  const permissions = useDocumentResourcePermissions(activityType, 'update');
  const requiredReady =
    !permissions.isPending && permissions.missingRequiredPermissions.length === 0;
  const canUsePartnerChoices = permissions.canUsePartnerChoices;
  const canUseProductChoices = permissions.canUseProductChoices;
  const canReadTaxes = permissions.canReadTaxes;
  const canReadTreasury = permissions.canReadTreasury;
  const canReadDocumentSettings = permissions.canReadDocumentSettings;
  const firmChoiceParams = React.useMemo(
    () => getDocumentFirmChoiceParams(canReadDocumentSettings),
    [canReadDocumentSettings]
  );
  const invoiceLabels = useSellingInvoiceLabels({ enabled: true, scope });
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const {
    isPending: isFetchPending,
    data: invoiceResp,
    refetch: refetchInvoice
  } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => api.invoice.findOne(parseInt(invoiceId, 10)),
    enabled: requiredReady
  });
  const invoice = React.useMemo(() => {
    return invoiceResp || null;
  }, [invoiceResp]);
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    const displayNumber = isBuying
      ? invoice?.reference || invoice?.sequential
      : invoice?.sequential;
    const isSellingDraftInvoice = invoice?.status === INVOICE_STATUS.Draft;
    setIntro?.(
      isSellingDraftInvoice
        ? invoiceLabels.editTitle
        : displayNumber
          ? `${invoiceLabels.editTitle} • ${displayNumber}`
          : invoiceLabels.editTitle,
      ''
    );
    if (displayNumber) {
      setRoutes?.([
        {
          title: tCommon('menu.selling'),
          href: '/selling'
        },
        { title: invoiceLabels.plural, href: listPath },
        { title: `${invoiceLabels.singular} N° ${displayNumber}` }
      ]);
    }
    return () => {
      clearIntro?.();
    };
  }, [
    router.locale,
    invoice?.sequential,
    invoice?.reference,
    isBuying,
    listPath,
    scope,
    invoiceLabels.editTitle,
    invoiceLabels.plural,
    invoiceLabels.singular
  ]);
  const closePreviewDialog = () => {
    setPreviewDialog(false);
    setPreviewBlob(null);
  };
  const openPreviewDialog = () => {
    if (!invoiceManager.id || invoiceManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadInvoicePreview();
  };
  const editMode = React.useMemo(
    () => isStatusEditable(invoice?.status, INVOICE_EDITABILITY_RULE),
    [invoice?.status]
  );
  const { firms, isFetchFirmsPending } = useFirmChoice({
    params: firmChoiceParams,
    entityType: isBuying ? 'suppliers' : 'clients',
    context: 'document',
    activityType,
    enabled: requiredReady && canUsePartnerChoices,
    silentForbiddenToast: true
  });
  const { quotations, isFetchQuotationPending } = useQuotationChoices(
    QUOTATION_STATUS.Invoiced,
    true,
    activityType
  );
  const { taxes, isFetchTaxesPending } = useTax({
    enabled: requiredReady && canReadTaxes,
    silentForbiddenToast: true
  });
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { bankAccounts, isFetchBankAccountsPending } = useBankAccount({
    enabled: requiredReady && canReadTreasury,
    silentForbiddenToast: true
  });
  React.useEffect(() => {
    if (!permissions.isPending && !canReadTreasury) {
      controlManager.set('isBankAccountDetailsHidden', true);
      invoiceManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  const { taxWithholdings, isFetchTaxWithholdingsPending } = useTaxWithholding({
    enabled: requiredReady && canReadTaxes,
    silentForbiddenToast: true
  });
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.INVOICE, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  const { dateRange, isFetchInvoiceRangePending } = useInvoiceRangeDates(invoiceManager.id);
  const initialLoading =
    permissions.isPending ||
    isFetchPending ||
    isFetchFirmsPending ||
    isFetchTaxesPending ||
    isFetchCurrenciesPending ||
    isFetchBankAccountsPending ||
    isFetchDefaultConditionPending ||
    isFetchQuotationPending ||
    isFetchTaxWithholdingsPending ||
    isFetchInvoiceRangePending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  const digitAfterComma = React.useMemo(() => {
    return invoiceManager.currency?.digitAfterComma || 3;
  }, [invoiceManager.currency]);
  React.useEffect(() => {
    const zero = dinero({ amount: 0, precision: digitAfterComma });
    const articles = articleManager.getArticles() || [];
    const subTotal = articles.reduce((acc, article) => {
      return acc.add(
        dinero({
          amount: createDineroAmountFromFloatWithDynamicCurrency(
            article?.subTotal || 0,
            digitAfterComma
          ),
          precision: digitAfterComma
        })
      );
    }, zero);
    invoiceManager.set('subTotal', subTotal.toUnit());
    const total = articles.reduce(
      (acc, article) =>
        acc.add(
          dinero({
            amount: createDineroAmountFromFloatWithDynamicCurrency(
              article?.total || 0,
              digitAfterComma
            ),
            precision: digitAfterComma
          })
        ),
      zero
    );
    let finalTotal = total;
    if (invoiceManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(invoiceManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          invoiceManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    if (canReadTaxes && invoiceManager.taxStampId) {
      const tax = taxes.find((currentTax) => currentTax.id === invoiceManager.taxStampId);
      if (tax) {
        const taxAmount = dinero({
          amount: createDineroAmountFromFloatWithDynamicCurrency(tax.value || 0, digitAfterComma),
          precision: digitAfterComma
        });
        finalTotal = finalTotal.add(taxAmount);
      }
    }
    invoiceManager.set('total', finalTotal.toUnit());
  }, [
    articleManager.articles,
    digitAfterComma,
    invoiceManager.discount,
    invoiceManager.discountType,
    invoiceManager.taxStampId,
    canReadTaxes,
    taxes
  ]);
  const setInvoiceData = (
    data: Partial<
      Invoice & {
        files: InvoiceUploadedFile[];
      }
    >
  ) => {
    if (data) invoiceManager.setInvoice(data, firms, bankAccounts);
    if (!canReadTreasury) invoiceManager.set('bankAccount', null);
    controlManager.setControls({
      isBankAccountDetailsHidden: !canReadTreasury || !data?.invoiceMetaData?.hasBankingDetails,
      isInvoiceAddressHidden: !data?.invoiceMetaData?.showInvoiceAddress,
      isDeliveryAddressHidden: !data?.invoiceMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.invoiceMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.invoiceMetaData?.hasGeneralConditions,
      isTaxStampHidden: !data?.invoiceMetaData?.hasTaxStamp,
      isTaxWithholdingHidden: !data?.invoiceMetaData?.hasTaxWithholding
    });
    articleManager.setArticles(data?.articleInvoiceEntries || []);
  };
  const { isDisabled, globalReset } = useInitializedState({
    data:
      invoice ||
      ({} as Partial<
        Invoice & {
          files: InvoiceUploadedFile[];
        }
      >),
    getCurrentData: () => {
      return {
        invoice: invoiceManager.getInvoice(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (
      data: Partial<
        Invoice & {
          files: InvoiceUploadedFile[];
        }
      >
    ) => {
      setInvoiceData(data);
    },
    resetData: () => {
      invoiceManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: initialLoading
  });
  const { mutate: updateInvoice, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { invoice: UpdateInvoiceDto; files: File[] }) =>
      api.invoice.update(data.invoice, data.files),
    onSuccess: () => {
      refetchInvoice();
      toast.success(invoiceLabels.t('action_update_success'));
    },
    onError: (error) => {
      const message = getErrorMessage('invoicing', error, invoiceLabels.t('action_update_failure'));
      toast.error(message);
    }
  });
  const { mutate: loadInvoicePreview, isPending: isPreviewPending } = useMutation({
    mutationFn: () => api.invoice.preview(invoiceManager.id || 0, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, invoiceLabels.t('action_preview_failure')));
      closePreviewDialog();
    }
  });
  const onSubmit = (status: INVOICE_STATUS) => {
    const articlesDto: ArticleInvoiceEntry[] = articleManager.getArticles()?.map((article) => ({
      article: {
        title: article?.article?.title,
        description: controlManager.isArticleDescriptionHidden ? '' : article?.article?.description
      },
      quantity: article?.quantity || 0,
      unit_price: article?.unit_price || 0,
      discount: article?.discount || 0,
      discount_type:
        article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      taxes: canReadTaxes ? article?.articleInvoiceEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
    }));
    const invoicePayload: UpdateInvoiceDto = {
      id: invoiceManager?.id,
      activityType,
      reference: isBuying ? invoiceManager.reference?.trim() : undefined,
      date: invoiceManager?.date?.toString(),
      dueDate: invoiceManager?.dueDate?.toString(),
      object: invoiceManager?.object,
      firmId: invoiceManager?.firm?.id,
      interlocutorId: invoiceManager?.interlocutor?.id,
      currencyId: invoiceManager?.currency?.id,
      bankAccountId: canReadTreasury && !controlManager?.isBankAccountDetailsHidden
        ? invoiceManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? invoiceManager?.generalConditions
        : '',
      notes: invoiceManager?.notes,
      articleInvoiceEntries: articlesDto,
      discount: invoiceManager?.discount,
      discount_type:
        invoiceManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      quotationId: invoiceManager?.quotationId,
      taxStampId: canReadTaxes ? invoiceManager?.taxStampId : undefined,
      taxWithholdingId: canReadTaxes ? invoiceManager?.taxWithholdingId : undefined,
      invoiceMetaData: {
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showInvoiceAddress: !controlManager?.isInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: canReadTreasury && !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden,
        hasTaxStamp: canReadTaxes && !controlManager.isTaxStampHidden,
        hasTaxWithholding: canReadTaxes && !controlManager.isTaxWithholdingHidden
      },
      uploads: invoiceManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.invoice.validate(invoicePayload, dateRange);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateInvoice({
        invoice: invoicePayload,
        files: invoiceManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };
  const isSellingDraft = invoiceManager.status === INVOICE_STATUS.Draft;
  const updateTargetStatus = invoiceManager.status || INVOICE_STATUS.Draft;
  const sellingDraftActions: DocumentEditorActionModel[] = [
    {
      id: 'draft',
      label: tCommon('commands.draft'),
      icon: FileText,
      disabled: !editMode || isUpdatingPending,
      onClick: () => onSubmit(INVOICE_FORM_STATUS.draft)
    },
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !invoiceManager.id || invoiceManager.id < 1,
      onClick: openPreviewDialog
    },
    {
      id: 'settings',
      label: tCommon('commands.settings'),
      icon: Settings2,
      disabled: !editMode,
      onClick: () => setSettingsDialogOpen(true)
    },
    {
      id: 'validate',
      label: tCommon('commands.validate'),
      icon: Check,
      variant: 'default',
      disabled: !editMode || isUpdatingPending,
      loading: isUpdatingPending,
      onClick: () => onSubmit(INVOICE_FORM_STATUS.validated)
    }
  ];
  const sellingStandardActions: DocumentEditorActionModel[] = [
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !invoiceManager.id || invoiceManager.id < 1,
      onClick: openPreviewDialog
    },
    {
      id: 'settings',
      label: tCommon('commands.settings'),
      icon: Settings2,
      disabled: !editMode,
      onClick: () => setSettingsDialogOpen(true)
    }
  ];
  const buyingActions: DocumentEditorActionModel[] = [
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !invoiceManager.id || invoiceManager.id < 1,
      onClick: openPreviewDialog
    },
    {
      id: 'settings',
      label: tCommon('commands.settings'),
      icon: Settings2,
      onClick: () => setSettingsDialogOpen(true)
    }
  ];
  if (isInitialRenderPending) return <Spinner className="h-screen" show={isInitialRenderPending} />;

  if (!permissions.isPending && !requiredReady) {
    return (
      <div className={cn('flex-1 overflow-auto py-6', className)}>
        <DocumentRequiredPermissionNotices
          activityType={activityType}
          action="update"
          canAccessDocumentAction={permissions.canAccessDocumentAction}
          className="mx-auto w-full max-w-3xl space-y-3 px-4"
        />
      </div>
    );
  }
return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={`${
          (isBuying ? invoiceManager.reference : undefined) ||
          invoiceManager.sequential ||
          `invoice-${invoiceManager.id || 'preview'}`
        }.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />

      <InvoiceSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <InvoiceControlSection
          layout="dialog"
          showActions={false}
          showHeaderLabel={false}
          showPayments={false}
          invoicePathPrefix={'/selling/invoice'}
          paymentPathPrefix={'/payments'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury} canReadTaxes={canReadTaxes}
          currencies={currencies}
          quotations={quotations}
          taxes={canReadTaxes ? taxes : []}
          taxWithholdings={canReadTaxes ? taxWithholdings : []}
          payments={invoice?.payments || []}
          handleSubmit={() => onSubmit(invoiceManager.status)}
          handleSubmitDraft={() => onSubmit(INVOICE_FORM_STATUS.draft)}
          handleSubmitValidated={() => onSubmit(INVOICE_FORM_STATUS.validated)}
          handleSubmitSent={() => onSubmit(INVOICE_FORM_STATUS.validated)}
          reset={globalReset}
          loading={isUpdatingPending}
          edit={editMode}
        />
      </InvoiceSettingsDialog>

      <DocumentEditorShell
        disabled={isUpdatingPending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() => router.push(listPath)}
            backLabel={tCommon('commands.back')}
            badge={
              invoiceManager.status ? (
                <DocumentStatusBadge
                  label={tInvoicing(invoiceManager.status)}
                  tone={invoiceManager.status === INVOICE_STATUS.Unpaid ? 'warning' : 'draft'}
                />
              ) : undefined
            }
          />
        }
        toolbarActions={
          isSellingDraft ? (
            <DocumentEditorActionGroup actions={sellingDraftActions} />
          ) : (
            <>
              <DocumentEditorActionGroup actions={sellingStandardActions} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {tCommon('commands.actions')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {invoiceManager.status === INVOICE_STATUS.Draft ? (
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => onSubmit(INVOICE_FORM_STATUS.validated)}
                    >
                      <Check className="h-4 w-4" />
                      {tCommon('commands.validate')}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled>
                      {tInvoicing('invoice.actions.no_action_available')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                disabled={!editMode || isDisabled || isUpdatingPending}
                onClick={() => onSubmit(updateTargetStatus)}
              >
                {tCommon('commands.update')}
                <Spinner show={isUpdatingPending} />
              </Button>
            </>
          )
        }
      >
        <InvoiceGeneralInformation
          activityType={activityType}
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          edit={editMode}
          loading={isUpdatingPending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <InvoiceArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            edit={editMode}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
            loading={isUpdatingPending}
           canUseProductChoices={canUseProductChoices} canReadTaxes={canReadTaxes} requiredReady={requiredReady}/>
        </div>

        <div className="flex justify-end border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <div className="w-full max-w-md">
            <CardTitle className="mb-4 text-base">{invoiceLabels.t('attributes.total')}</CardTitle>
            <InvoiceFinancialInformation
              subTotal={invoiceManager.subTotal}
              status={invoiceManager.status}
              currency={invoiceManager.currency}
              taxes={canReadTaxes ? taxes.filter((tax) => !tax.isRate) : []}
              taxWithholdings={canReadTaxes ? taxWithholdings : []}
              loading={isUpdatingPending}
              edit={editMode}
            />
          </div>
        </div>

        {invoice?.payments?.length ? (
          <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <CardTitle className="mb-4 text-base">{tInvoicing('payment.plural')}</CardTitle>
            <InvoicePaymentList
              payments={invoice.payments}
              currencies={currencies}
              paymentPathPrefix={'/payments'}
            />
          </div>
        ) : null}

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">{invoiceLabels.t('attributes.notes')}</CardTitle>
            <InvoiceExtraOptions loading={isUpdatingPending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {invoiceLabels.t('attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <InvoiceGeneralConditions
              isPending={isUpdatingPending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
              edit={editMode}
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <InvoiceExtraOptions mode="files" />
        </div>
      </DocumentEditorShell>
    </div>
  );
};

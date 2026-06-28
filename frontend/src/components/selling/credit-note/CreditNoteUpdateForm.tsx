import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ArticleCreditNoteEntry,
  CREDIT_NOTE_STATUS,
  CreditNote,
  CreditNoteUploadedFile,
  QUOTATION_STATUS,
  UpdateCreditNoteDto
} from '@/types';
import { Spinner } from '@/components/shared';
import { CardTitle } from '@/components/ui/card';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useCreditNoteManager } from './hooks/useCreditNoteManager';
import { useCreditNoteArticleManager } from './hooks/useCreditNoteArticleManager';
import { useCreditNoteControlManager } from './hooks/useCreditNoteControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { CreditNoteExtraOptions } from './form/CreditNoteExtraOptions';
import { CreditNoteGeneralConditions } from './form/CreditNoteGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import useQuotationChoices from '@/hooks/content/useQuotationChoice';
import { CreditNoteGeneralInformation } from './form/CreditNoteGeneralInformation';
import { CreditNoteArticleManagement } from './form/CreditNoteArticleManagement';
import { CreditNoteFinancialInformation } from './form/CreditNoteFinancialInformation';
import { CreditNoteControlSection } from './form/CreditNoteControlSection';
import useTaxWithholding from '@/hooks/content/useTaxWithholding';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import useCreditNoteRangeDates from '@/hooks/content/useCreditNoteRangeDates';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { CreditNoteSettingsDialog } from './dialogs/CreditNoteSettingsDialog';
import { CreditNotePaymentList } from './form/CreditNotePaymentList';
import { Check, Eye, FileText, Settings2 } from 'lucide-react';
import {
  DocumentEditorActionGroup,
  DocumentEditorActionModel,
  DocumentEditorLead,
  DocumentEditorShell,
  useInitialEditorLoading
} from '@/features/invoicing/shared/editor';
import { DocumentStatusBadge } from '@/features/invoicing/shared/status';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface CreditNoteFormProps {
  className?: string;
  creditNoteId: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
const getCreditNoteStatusTone = (status?: CREDIT_NOTE_STATUS) => {
  switch (status) {
    case CREDIT_NOTE_STATUS.Draft:
      return 'draft' as const;
    case CREDIT_NOTE_STATUS.Unpaid:
      return 'warning' as const;
    case CREDIT_NOTE_STATUS.PartiallyPaid:
      return 'info' as const;
    case CREDIT_NOTE_STATUS.Paid:
      return 'success' as const;
    case CREDIT_NOTE_STATUS.Expired:
      return 'neutral' as const;
    default:
      return 'neutral' as const;
  }
};
export const CreditNoteUpdateForm = ({
  className,
  creditNoteId,
  scope = 'selling',
  listPath = '/selling/credit-notes'
}: CreditNoteFormProps) => {
  const router = useRouter();
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const creditNoteManager = useCreditNoteManager();
  const controlManager = useCreditNoteControlManager();
  const articleManager = useCreditNoteArticleManager();
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
  const documentLabels = useScopedDocumentLabels('creditNote', scope);
  const showPrices = !controlManager.isPricesHidden;
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const {
    isPending: isFetchPending,
    data: creditNoteResp,
    refetch: refetchCreditNote
  } = useQuery({
    queryKey: ['creditNote', creditNoteId],
    queryFn: () => api.creditNote.findOne(parseInt(creditNoteId, 10)),
    enabled: requiredReady
  });
  const creditNote = React.useMemo(() => {
    return creditNoteResp || null;
  }, [creditNoteResp]);
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    const displayNumber = isBuying
      ? creditNote?.reference || creditNote?.sequential
      : creditNote?.sequential;
    if (displayNumber) {
      setRoutes?.([
        {
          title: tCommon('menu.selling'),
          href: '/selling'
        },
        { title: documentLabels.plural, href: listPath },
        { title: `${documentLabels.singular} N° ${displayNumber}` }
      ]);
    }
  }, [
    router.locale,
    creditNote?.sequential,
    creditNote?.reference,
    isBuying,
    listPath,
    scope,
    documentLabels.plural,
    documentLabels.singular,
    setRoutes,
    tCommon
  ]);
  const closePreviewDialog = () => {
    setPreviewDialog(false);
    setPreviewBlob(null);
  };
  const openPreviewDialog = () => {
    if (!creditNoteManager.id || creditNoteManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadCreditNotePreview();
  };
  const editMode = React.useMemo(() => {
    const editModeStatuses = [CREDIT_NOTE_STATUS.Draft, CREDIT_NOTE_STATUS.Unpaid];
    return creditNote?.status && editModeStatuses.includes(creditNote.status);
  }, [creditNote]);
  const { firms, isFetchFirmsPending } = useFirmChoice({
    params: firmChoiceParams,
    entityType: isBuying ? 'suppliers' : 'clients',
    context: 'document',
    activityType,
    enabled: requiredReady && canUsePartnerChoices,
    silentForbiddenToast: true
  });
  const { quotations, isFetchQuotationPending } = useQuotationChoices(
    QUOTATION_STATUS.CreditNoted,
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
      creditNoteManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  const { taxWithholdings, isFetchTaxWithholdingsPending } = useTaxWithholding({
    enabled: requiredReady && canReadTaxes,
    silentForbiddenToast: true
  });
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.CREDIT_NOTE, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  const { dateRange, isFetchCreditNoteRangePending } = useCreditNoteRangeDates(
    creditNoteManager.id
  );
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
    isFetchCreditNoteRangePending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  const digitAfterComma = React.useMemo(() => {
    return creditNoteManager.currency?.digitAfterComma || 3;
  }, [creditNoteManager.currency]);
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
    creditNoteManager.set('subTotal', subTotal.toUnit());
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
    if (creditNoteManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(creditNoteManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          creditNoteManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    if (canReadTaxes && creditNoteManager.taxStampId) {
      const tax = taxes.find((currentTax) => currentTax.id === creditNoteManager.taxStampId);
      if (tax) {
        const taxAmount = dinero({
          amount: createDineroAmountFromFloatWithDynamicCurrency(tax.value || 0, digitAfterComma),
          precision: digitAfterComma
        });
        finalTotal = finalTotal.add(taxAmount);
      }
    }
    creditNoteManager.set('total', finalTotal.toUnit());
  }, [
    articleManager.articles,
    digitAfterComma,
    creditNoteManager.discount,
    creditNoteManager.discountType,
    creditNoteManager.taxStampId,
    canReadTaxes,
    taxes
  ]);
  const setCreditNoteData = (
    data: Partial<
      CreditNote & {
        files: CreditNoteUploadedFile[];
      }
    >
  ) => {
    if (data) creditNoteManager.setCreditNote(data, firms, bankAccounts);
    if (!canReadTreasury) creditNoteManager.set('bankAccount', null);
    controlManager.setControls({
      isBankAccountDetailsHidden: !canReadTreasury || !data?.creditNoteMetaData?.hasBankingDetails,
      isCreditNoteAddressHidden: !(
        data?.creditNoteMetaData?.showCreditNoteAddress ??
        data?.creditNoteMetaData?.showInvoiceAddress
      ),
      isDeliveryAddressHidden: !data?.creditNoteMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.creditNoteMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.creditNoteMetaData?.hasGeneralConditions,
      isPricesHidden: data?.creditNoteMetaData?.showPrices === false,
      isTaxStampHidden: !data?.creditNoteMetaData?.hasTaxStamp,
      isTaxWithholdingHidden: !data?.creditNoteMetaData?.hasTaxWithholding
    });
    articleManager.setArticles(data?.articleCreditNoteEntries || []);
  };
  const { isDisabled, globalReset } = useInitializedState({
    data:
      creditNote ||
      ({} as Partial<
        CreditNote & {
          files: CreditNoteUploadedFile[];
        }
      >),
    getCurrentData: () => {
      return {
        creditNote: creditNoteManager.getCreditNote(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (
      data: Partial<
        CreditNote & {
          files: CreditNoteUploadedFile[];
        }
      >
    ) => {
      setCreditNoteData(data);
    },
    resetData: () => {
      creditNoteManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: initialLoading
  });
  const { mutate: updateCreditNote, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { creditNote: UpdateCreditNoteDto; files: File[] }) =>
      api.creditNote.update(data.creditNote, data.files),
    onSuccess: () => {
      refetchCreditNote();
      toast.success(tInvoicing('creditNote.action_update_success'));
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('creditNote.action_update_failure')
      );
      toast.error(message);
    }
  });
  const { mutate: loadCreditNotePreview, isPending: isPreviewPending } = useMutation({
    mutationFn: () => api.creditNote.preview(creditNoteManager.id || 0, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('creditNote.action_preview_failure'))
      );
      closePreviewDialog();
    }
  });
  const onSubmit = (status: CREDIT_NOTE_STATUS) => {
    const articlesDto: ArticleCreditNoteEntry[] = articleManager.getArticles()?.map((article) => ({
      article: {
        title: article?.article?.title,
        description: controlManager.isArticleDescriptionHidden ? '' : article?.article?.description
      },
      quantity: article?.quantity || 0,
      unit_price: article?.unit_price || 0,
      discount: article?.discount || 0,
      discount_type:
        article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      taxes: canReadTaxes ? article?.articleCreditNoteEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
    }));
    const creditNotePayload: UpdateCreditNoteDto = {
      id: creditNoteManager?.id,
      activityType,
      reference: isBuying ? creditNoteManager.reference?.trim() : undefined,
      date: creditNoteManager?.date?.toString(),
      dueDate: creditNoteManager?.dueDate?.toString(),
      object: creditNoteManager?.object,
      firmId: creditNoteManager?.firm?.id,
      interlocutorId: creditNoteManager?.interlocutor?.id,
      currencyId: creditNoteManager?.currency?.id,
      bankAccountId: canReadTreasury && !controlManager?.isBankAccountDetailsHidden
        ? creditNoteManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? creditNoteManager?.generalConditions
        : '',
      notes: creditNoteManager?.notes,
      articleCreditNoteEntries: articlesDto,
      discount: creditNoteManager?.discount,
      discount_type:
        creditNoteManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      quotationId: creditNoteManager?.quotationId,
      taxStampId: canReadTaxes ? creditNoteManager?.taxStampId : undefined,
      taxWithholdingId: canReadTaxes ? creditNoteManager?.taxWithholdingId : undefined,
      creditNoteMetaData: {
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showInvoiceAddress: !controlManager?.isCreditNoteAddressHidden,
        showCreditNoteAddress: !controlManager?.isCreditNoteAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: canReadTreasury && !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden,
        showPrices,
        hasTaxStamp: canReadTaxes && !controlManager.isTaxStampHidden,
        hasTaxWithholding: canReadTaxes && !controlManager.isTaxWithholdingHidden
      },
      uploads: creditNoteManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.creditNote.validate(creditNotePayload, dateRange);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateCreditNote({
        creditNote: creditNotePayload,
        files: creditNoteManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };
  if (isInitialRenderPending) {
    return <Spinner className="h-screen" show={isInitialRenderPending} />;
  }

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
          (isBuying ? creditNoteManager.reference : undefined) ||
          creditNoteManager.sequential ||
          `creditNote-${creditNoteManager.id || 'preview'}`
        }.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />

      <CreditNoteSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <CreditNoteControlSection
          layout="dialog"
          status={creditNoteManager.status}
          isDataAltered={isDisabled}
          showActions={false}
          showHeaderLabel={false}
          showPayments={false}
          creditNotePathPrefix={'/selling/credit-note'}
          paymentPathPrefix={'/payments'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury} canReadTaxes={canReadTaxes}
          currencies={currencies}
          quotations={quotations}
          taxes={canReadTaxes ? taxes : []}
          taxWithholdings={canReadTaxes ? taxWithholdings : []}
          payments={creditNote?.payments || []}
          handleSubmit={() => onSubmit(creditNoteManager.status)}
          handleSubmitDraft={() => onSubmit(CREDIT_NOTE_STATUS.Draft)}
          handleSubmitValidated={() => onSubmit(CREDIT_NOTE_STATUS.Unpaid)}
          handleSubmitSent={() => onSubmit(CREDIT_NOTE_STATUS.Unpaid)}
          reset={globalReset}
          loading={isUpdatingPending}
          edit={editMode}
        />
      </CreditNoteSettingsDialog>

      {(() => {
        const isDraftCreditNote = creditNoteManager.status === CREDIT_NOTE_STATUS.Draft;
        const updateTargetStatus = creditNoteManager.status || CREDIT_NOTE_STATUS.Draft;
        const draftActions: DocumentEditorActionModel[] = [
          {
            id: 'draft',
            label: tCommon('commands.draft'),
            icon: FileText,
            disabled: !editMode || isUpdatingPending,
            onClick: () => onSubmit(CREDIT_NOTE_STATUS.Draft)
          },
          {
            id: 'preview',
            label: tCommon('commands.preview'),
            icon: Eye,
            disabled: !creditNoteManager.id || creditNoteManager.id < 1 || isUpdatingPending,
            onClick: openPreviewDialog
          },
          {
            id: 'settings',
            label: tCommon('commands.settings'),
            icon: Settings2,
            disabled: !editMode || isUpdatingPending,
            onClick: () => setSettingsDialogOpen(true)
          },
          {
            id: 'validate',
            label: tCommon('commands.validate'),
            icon: Check,
            variant: 'default',
            disabled: !editMode || isUpdatingPending,
            loading: isUpdatingPending,
            onClick: () => onSubmit(CREDIT_NOTE_STATUS.Unpaid)
          }
        ];
        const standardActions: DocumentEditorActionModel[] = [
          {
            id: 'preview',
            label: tCommon('commands.preview'),
            icon: Eye,
            disabled: !creditNoteManager.id || creditNoteManager.id < 1 || isUpdatingPending,
            onClick: openPreviewDialog
          },
          {
            id: 'settings',
            label: tCommon('commands.settings'),
            icon: Settings2,
            disabled: !editMode || isUpdatingPending,
            onClick: () => setSettingsDialogOpen(true)
          }
        ];
        return (
          <DocumentEditorShell
            disabled={isUpdatingPending}
            toolbarLeading={
              <DocumentEditorLead
                onBack={() => router.push(listPath)}
                backLabel={tCommon('commands.back')}
                badge={
                  creditNoteManager.status ? (
                    <DocumentStatusBadge
                      label={tInvoicing(creditNoteManager.status)}
                      tone={getCreditNoteStatusTone(creditNoteManager.status)}
                    />
                  ) : undefined
                }
              />
            }
            toolbarActions={
              isDraftCreditNote ? (
                <DocumentEditorActionGroup actions={draftActions} />
              ) : (
                <>
                  <DocumentEditorActionGroup actions={standardActions} />
                  <CreditNoteControlSection
                    layout="floating"
                    status={creditNoteManager.status}
                    isDataAltered={isDisabled}
                    showHeaderLabel={false}
                    showConfiguration={false}
                    showVisibility={false}
                    showPayments={false}
                    creditNotePathPrefix={'/selling/credit-note'}
                    paymentPathPrefix={'/payments'}
                    listPath={listPath}
                    bankAccounts={bankAccounts} canReadTreasury={canReadTreasury} canReadTaxes={canReadTaxes}
                    currencies={currencies}
                    quotations={quotations}
                    taxes={canReadTaxes ? taxes : []}
                    payments={creditNote?.payments || []}
                    taxWithholdings={canReadTaxes ? taxWithholdings : []}
                    handleSubmit={() => onSubmit(updateTargetStatus)}
                    handleSubmitDraft={() => onSubmit(CREDIT_NOTE_STATUS.Draft)}
                    handleSubmitValidated={() => onSubmit(CREDIT_NOTE_STATUS.Unpaid)}
                    handleSubmitSent={() => onSubmit(CREDIT_NOTE_STATUS.Unpaid)}
                    reset={globalReset}
                    loading={isUpdatingPending}
                    edit={editMode}
                  />
                </>
              )
            }
          >
            <CreditNoteGeneralInformation
              activityType={activityType}
              firms={firms}
              isInvoicingAddressHidden={controlManager.isCreditNoteAddressHidden}
              isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
              edit={editMode}
              loading={isUpdatingPending}
            />

            <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <CreditNoteArticleManagement
                embedded
                taxes={canReadTaxes ? taxes : []}
                edit={editMode}
                isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
                showPrices={showPrices}
                loading={isUpdatingPending}
               canUseProductChoices={canUseProductChoices} canReadTaxes={canReadTaxes} requiredReady={requiredReady}/>
            </div>

            {showPrices && (
              <div className="flex justify-end border-t border-zinc-200 pt-8 dark:border-zinc-800">
                <div className="w-full max-w-md">
                  <CardTitle className="mb-4 text-base">
                    {tInvoicing('creditNote.attributes.total')}
                  </CardTitle>
                  <CreditNoteFinancialInformation
                    subTotal={creditNoteManager.subTotal}
                    status={creditNoteManager.status}
                    currency={creditNoteManager.currency}
                    taxes={canReadTaxes ? taxes.filter((tax) => !tax.isRate) : []}
                    taxWithholdings={canReadTaxes ? taxWithholdings : []}
                    loading={isUpdatingPending}
                    edit={editMode}
                  />
                </div>
              </div>
            )}

            {creditNote?.payments?.length ? (
              <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
                <CardTitle className="mb-4 text-base">{tInvoicing('payment.plural')}</CardTitle>
                <CreditNotePaymentList
                  payments={creditNote.payments}
                  currencies={currencies}
                  paymentPathPrefix={'/payments'}
                />
              </div>
            ) : null}

            <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
              <div className="space-y-3">
                <CardTitle className="text-base">
                  {tInvoicing('creditNote.attributes.notes')}
                </CardTitle>
                <CreditNoteExtraOptions loading={isUpdatingPending} mode="notes" />
              </div>

              <div className="space-y-3">
                <CardTitle className="text-base">
                  {tInvoicing('creditNote.attributes.general_condition')}
                </CardTitle>
                {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <CreditNoteGeneralConditions
                  isPending={isUpdatingPending}
                  hidden={controlManager.isGeneralConditionsHidden}
                  defaultCondition={defaultCondition}
                  edit={editMode}
                />
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <CreditNoteExtraOptions mode="files" />
            </div>
          </DocumentEditorShell>
        );
      })()}
    </div>
  );
};

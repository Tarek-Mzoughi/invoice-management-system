import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ArticleCreditNoteEntry,
  CreateCreditNoteDto,
  CREDIT_NOTE_STATUS,
  QUOTATION_STATUS
} from '@/types';
import { Spinner } from '@/components/shared';
import { CardTitle } from '@/components/ui/card';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useCreditNoteManager } from '@/components/buying/supplier-credit-note/hooks/useCreditNoteManager';
import { useCreditNoteArticleManager } from './hooks/useCreditNoteArticleManager';
import useCreditNoteSocket from './hooks/useCreditNoteSocket';
import { useCreditNoteControlManager } from './hooks/useCreditNoteControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import useCabinet from '@/hooks/content/useCabinet';
import { CreditNoteExtraOptions } from './form/CreditNoteExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { CreditNoteGeneralConditions } from './form/CreditNoteGeneralConditions';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
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
  firmId?: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const CreditNoteCreateForm = ({
  className,
  firmId,
  scope = 'buying',
  listPath = '/buying/avoirs-fournisseurs'
}: CreditNoteFormProps) => {
  const router = useRouter();
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { t: tContacts } = useTranslation('contacts');
  const creditNoteManager = useCreditNoteManager();
  const articleManager = useCreditNoteArticleManager();
  const controlManager = useCreditNoteControlManager();
  const activityType = ACTIVITY_TYPE.BUYING;
  const isBuying = true;
  const permissions = useDocumentResourcePermissions(activityType, 'create');
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
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes?.(
      !firmId
        ? [
            {
              title: tCommon('menu.buying'),
              href: '/buying'
            },
            { title: documentLabels.plural, href: listPath },
            { title: documentLabels.newLabel }
          ]
        : [
            { title: tCommon('menu.contacts'), href: '/contacts' },
            { title: tContacts('firm.plural'), href: '/contacts/firms' },
            {
              title: `${tContacts('firm.singular')} N°${firmId}`,
              href: `/contacts/firm/${firmId}?tab=entreprise`
            },
            { title: documentLabels.newLabel }
          ]
    );
  }, [
    router.locale,
    firmId,
    listPath,
    scope,
    documentLabels.newLabel,
    documentLabels.plural,
    setRoutes,
    tCommon,
    tContacts
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
  const { cabinet, isFetchCabinetPending } = useCabinet();
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
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.CREDIT_NOTE, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  const { taxWithholdings, isFetchTaxWithholdingsPending } = useTaxWithholding({
    enabled: requiredReady && canReadTaxes,
    silentForbiddenToast: true
  });
  const { dateRange, isFetchCreditNoteRangePending } = useCreditNoteRangeDates(
    creditNoteManager.id
  );
  const { currentSequence, isSequencePending } = useCreditNoteSocket(requiredReady && canReadDocumentSettings);
  React.useEffect(() => {
    creditNoteManager.set('sequentialNumber', currentSequence);
    creditNoteManager.set(
      'bankAccount',
      bankAccounts.find((account) => account.isMain)
    );
    creditNoteManager.set('currency', cabinet?.currency);
  }, [currentSequence]);
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
  const { mutate: createCreditNote, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { creditNote: CreateCreditNoteDto; files: File[] }) =>
      api.creditNote.create(data.creditNote, data.files),
    onSuccess: () => {
      if (!firmId) {
        router.push(listPath);
      } else {
        router.push(`/contacts/firm/${firmId}/?tab=creditNotes`);
      }
      toast.success(tInvoicing('creditNote.action_create_success'));
      globalReset();
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('creditNote.action_create_failure')
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
  const initialLoading =
    permissions.isPending ||
    isFetchFirmsPending ||
    isFetchTaxesPending ||
    isFetchCabinetPending ||
    isFetchBankAccountsPending ||
    isFetchCurrenciesPending ||
    isFetchDefaultConditionPending ||
    isFetchQuotationPending ||
    isFetchTaxWithholdingsPending ||
    isFetchCreditNoteRangePending ||
    isSequencePending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  const globalReset = () => {
    creditNoteManager.reset();
    articleManager.reset();
    controlManager.reset();
    creditNoteManager.set('activityType', activityType);
    creditNoteManager.set('reference', '');
  };
  React.useEffect(() => {
    globalReset();
  }, []);
  const onSubmit = (status: CREDIT_NOTE_STATUS) => {
    const articlesDto: ArticleCreditNoteEntry[] = articleManager.getArticles()?.map((article) => ({
      id: article?.id,
      article: {
        title: article?.article?.title || '',
        description: !controlManager.isArticleDescriptionHidden
          ? article?.article?.description || ''
          : ''
      },
      quantity: article?.quantity || 0,
      unit_price: article?.unit_price || 0,
      discount: article?.discount || 0,
      discount_type:
        article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      taxes: canReadTaxes ? article?.articleCreditNoteEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
    }));
    const creditNote: CreateCreditNoteDto = {
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
        hasTaxWithholding: canReadTaxes && !controlManager.isTaxWithholdingHidden,
        hasTaxStamp: canReadTaxes && !controlManager.isTaxStampHidden,
        showPrices
      }
    };
    const validation = api.creditNote.validate(creditNote, dateRange);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete creditNote.generalConditions;
      createCreditNote({
        creditNote,
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
          action="create"
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
          showActions={false}
          showHeaderLabel={false}
          showPayments={false}
          creditNotePathPrefix={'/buying/avoir-fournisseur'}
          paymentPathPrefix={'/payments'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury} canReadTaxes={canReadTaxes}
          currencies={currencies}
          quotations={quotations}
          taxes={canReadTaxes ? taxes : []}
          taxWithholdings={canReadTaxes ? taxWithholdings : []}
          payments={[]}
          handleSubmitDraft={() => onSubmit(CREDIT_NOTE_STATUS.Draft)}
          handleSubmitValidated={() => onSubmit(CREDIT_NOTE_STATUS.Unpaid)}
          handleSubmitSent={() => onSubmit(CREDIT_NOTE_STATUS.Unpaid)}
          reset={globalReset}
          loading={isCreatePending}
        />
      </CreditNoteSettingsDialog>

      {(() => {
        const createActions: DocumentEditorActionModel[] = [
          {
            id: 'draft',
            label: tCommon('commands.draft'),
            icon: FileText,
            disabled: isCreatePending,
            onClick: () => onSubmit(CREDIT_NOTE_STATUS.Draft)
          },
          {
            id: 'preview',
            label: tCommon('commands.preview'),
            icon: Eye,
            disabled: !creditNoteManager.id || creditNoteManager.id < 1 || isCreatePending,
            onClick: openPreviewDialog
          },
          {
            id: 'settings',
            label: tCommon('commands.settings'),
            icon: Settings2,
            disabled: isCreatePending,
            onClick: () => setSettingsDialogOpen(true)
          },
          {
            id: 'validate',
            label: tCommon('commands.validate'),
            icon: Check,
            variant: 'default',
            disabled: isCreatePending,
            loading: isCreatePending,
            onClick: () => onSubmit(CREDIT_NOTE_STATUS.Unpaid)
          }
        ];
        return (
          <DocumentEditorShell
            disabled={isCreatePending}
            toolbarLeading={
              <DocumentEditorLead
                onBack={() =>
                  router.push(firmId ? `/contacts/firm/${firmId}/?tab=creditNotes` : listPath)
                }
                backLabel={tCommon('commands.back')}
                badge={<DocumentStatusBadge label={tCommon('commands.draft')} tone="draft" />}
              />
            }
            toolbarActions={<DocumentEditorActionGroup actions={createActions} />}
          >
            <CreditNoteGeneralInformation
              activityType={activityType}
              firms={firms}
              isInvoicingAddressHidden={controlManager.isCreditNoteAddressHidden}
              isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
              loading={isCreatePending}
            />

            <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <CreditNoteArticleManagement
                embedded
                taxes={canReadTaxes ? taxes : []}
                isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
                showPrices={showPrices}
                loading={isCreatePending}
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
                    status={CREDIT_NOTE_STATUS.Nonexistent}
                    currency={creditNoteManager.currency}
                    taxes={canReadTaxes ? taxes.filter((tax) => !tax.isRate) : []}
                    taxWithholdings={canReadTaxes ? taxWithholdings : []}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
              <div className="space-y-3">
                <CardTitle className="text-base">
                  {tInvoicing('creditNote.attributes.notes')}
                </CardTitle>
                <CreditNoteExtraOptions loading={isCreatePending} mode="notes" />
              </div>

              <div className="space-y-3">
                <CardTitle className="text-base">
                  {tInvoicing('creditNote.attributes.general_condition')}
                </CardTitle>
                {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <CreditNoteGeneralConditions
                  isPending={isCreatePending}
                  hidden={controlManager.isGeneralConditionsHidden}
                  defaultCondition={defaultCondition}
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

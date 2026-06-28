import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleQuotationEntry,
  CreateQuotationDto,
  QUOTATION_STATUS,
  Sequences
} from '@/types';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useQuotationManager } from '@/components/selling/quotation/hooks/useQuotationManager';
import { useQuotationArticleManager } from './hooks/useQuotationArticleManager';
import useQuotationSocket from './hooks/useQuotationSocket';
import { useQuotationControlManager } from './hooks/useQuotationControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import useCabinet from '@/hooks/content/useCabinet';
import { QuotationExtraOptions } from './form/QuotationExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { QuotationGeneralConditions } from './form/QuotationGeneralConditions';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { QuotationGeneralInformation } from './form/QuotationGeneralInformation';
import { QuotationArticleManagement } from './form/QuotationArticleManagement';
import { QuotationFinancialInformation } from './form/QuotationFinancialInformation';
import { QuotationControlSection } from './form/QuotationControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { QuotationSettingsDialog } from './dialogs/QuotationSettingsDialog';
import { useIntro } from '@/context/IntroContext';
import { useDocumentTransformation } from '@/hooks/content/useDocumentTransformation';
import { Eye, Settings2 } from 'lucide-react';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import {
  DocumentEditorLead,
  DocumentEditorShell,
  useInitialEditorLoading
} from '@/features/invoicing/shared/editor';
import { DocumentStatusBadge } from '@/features/invoicing/shared/status';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface QuotationFormProps {
  className?: string;
  firmId?: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const QuotationCreateForm = ({
  className,
  firmId,
  scope = 'selling',
  listPath = '/selling/quotations'
}: QuotationFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { t: tContacts } = useTranslation('contacts');
  // Stores
  const quotationManager = useQuotationManager();
  const articleManager = useQuotationArticleManager();
  const controlManager = useQuotationControlManager();
  const activityType = ACTIVITY_TYPE.SELLING;
  const isBuying = false;
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
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    setIntro?.(tInvoicing('quotation.new'), '');
    setRoutes?.(
      !firmId
        ? [
            {
              title: tCommon('menu.selling'),
              href: '/selling'
            },
            { title: tInvoicing('quotation.plural'), href: listPath },
            { title: tInvoicing('quotation.new') }
          ]
        : [
            { title: tCommon('menu.contacts'), href: '/contacts' },
            { title: tContacts('firm.plural'), href: '/contacts/firms' },
            {
              title: `${tContacts('firm.singular')} N°${firmId}`,
              href: `/contacts/firm/${firmId}?tab=entreprise`
            },
            { title: tInvoicing('quotation.new') }
          ]
    );
    return () => {
      clearIntro?.();
    };
  }, [router.locale, firmId, listPath, scope]);
  const closePreviewDialog = () => {
    setPreviewDialog(false);
    setPreviewBlob(null);
  };
  const openPreviewDialog = () => {
    if (!quotationManager.id || quotationManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadQuotationPreview();
  };
  // Fetch options
  const { firms, isFetchFirmsPending } = useFirmChoice({
    params: firmChoiceParams,
    entityType: isBuying ? 'suppliers' : 'clients',
    context: 'document',
    activityType,
    enabled: requiredReady && canUsePartnerChoices,
    silentForbiddenToast: true
  });
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
      quotationManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  // Handle transformation from source
  useDocumentTransformation(
    quotationManager.setQuotation,
    articleManager.setArticles,
    controlManager.setControls,
    firms,
    bankAccounts
  );
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.QUOTATION, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  //websocket to listen for server changes related to sequence number
  const { currentSequence, isSequencePending: isQuotationSequencePending } = useQuotationSocket(
    isBuying ? Sequences.BUYING_QUOTATION : Sequences.QUOTATION,
    !isBuying,
    requiredReady && canReadDocumentSettings
  );
  //handle Sequential Number
  React.useEffect(() => {
    quotationManager.set('sequentialNumber', currentSequence);
    quotationManager.set(
      'bankAccount',
      bankAccounts.find((a) => a.isMain)
    );
    quotationManager.set('currency', cabinet?.currency);
  }, [currentSequence]);
  // perform calculations when the financialy Information are changed
  const digitAfterComma = React.useMemo(() => {
    return quotationManager.currency?.digitAfterComma || 3;
  }, [quotationManager.currency]);
  React.useEffect(() => {
    const zero = dinero({ amount: 0, precision: digitAfterComma });
    const articles = articleManager.getArticles() || [];
    // Calculate subTotal
    const subTotal = articles?.reduce((acc, article) => {
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
    quotationManager.set('subTotal', subTotal.toUnit());
    // Calculate total
    const total = articles?.reduce(
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
    // Apply discount
    if (quotationManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(quotationManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          quotationManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    quotationManager.set('total', finalTotal.toUnit());
  }, [articleManager.articles, quotationManager.discount, quotationManager.discountType]);
  //create quotation mutator
  const { mutate: createQuotation, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { quotation: CreateQuotationDto; files: File[] }) =>
      api.quotation.create(data.quotation, data.files),
    onSuccess: () => {
      if (!firmId) router.push(listPath);
      else router.push(`/contacts/firm/${firmId}/?tab=quotations`);
      toast.success(tInvoicing('quotation.action_create_success'));
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('quotation.action_create_failure')
      );
      toast.error(message);
    }
  });
  const { mutate: loadQuotationPreview, isPending: isPreviewPending } = useMutation({
    mutationFn: () => api.quotation.preview(quotationManager.id || 0, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('quotation.action_preview_failure'))
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
    isQuotationSequencePending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  //Reset Form
  const globalReset = () => {
    quotationManager.reset();
    articleManager.reset();
    controlManager.reset();
    quotationManager.set('activityType', activityType);
  };
  //side effect to reset the form when the component is mounted
  React.useEffect(() => {
    globalReset();
  }, []);
  //create handler
  const onSubmit = (status: QUOTATION_STATUS) => {
    const articlesDto: ArticleQuotationEntry[] = articleManager.getArticles()?.map((article) => ({
      id: article?.id,
      article: {
        title: article?.article?.title,
        description: !controlManager.isArticleDescriptionHidden ? article?.article?.description : ''
      },
      quantity: article?.quantity,
      unit_price: article?.unit_price,
      discount: article?.discount,
      discount_type:
        article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      taxes: canReadTaxes
        ? article?.articleQuotationEntryTaxes?.map((entry) => {
            return entry?.tax?.id;
          }) || []
        : []
    }));
    const quotation: CreateQuotationDto = {
      activityType,
      date: quotationManager?.date?.toString(),
      dueDate: quotationManager?.dueDate?.toString(),
      object: quotationManager?.object,
      firmId: quotationManager?.firm?.id,
      interlocutorId: quotationManager?.interlocutor?.id,
      currencyId: quotationManager?.currency?.id,
      bankAccountId: canReadTreasury && !controlManager?.isBankAccountDetailsHidden
        ? quotationManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? quotationManager?.generalConditions
        : '',
      notes: quotationManager?.notes,
      articleQuotationEntries: articlesDto,
      discount: quotationManager?.discount,
      discount_type:
        quotationManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      quotationMetaData: {
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showInvoiceAddress: !controlManager?.isInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: canReadTreasury && !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden
      }
    };
    const validation = api.quotation.validate(quotation);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete quotation.generalConditions;
      createQuotation({
        quotation,
        files: quotationManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
      globalReset();
    }
  };
  //component representation
  if (isInitialRenderPending) return <Spinner className="h-screen" show={isInitialRenderPending} />;

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
        filename={`${quotationManager.sequential || `quotation-${quotationManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <QuotationSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <QuotationControlSection
          layout="dialog"
          showActions={false}
          showHeaderLabel={false}
          showInvoices={false}
          allowInvoiceAction={!isBuying}
          quotationPathPrefix={'/selling/quotation'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          invoices={[]}
          handleSubmitDraft={() => onSubmit(QUOTATION_STATUS.Draft)}
          handleSubmitValidated={() => onSubmit(QUOTATION_STATUS.Validated)}
          reset={globalReset}
          loading={isCreatePending}
        />
      </QuotationSettingsDialog>
      <DocumentEditorShell
        disabled={isCreatePending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() =>
              router.push(firmId ? `/contacts/firm/${firmId}/?tab=quotations` : listPath)
            }
            backLabel={tCommon('commands.back')}
            badge={<DocumentStatusBadge label={tCommon('commands.draft')} tone="draft" />}
          />
        }
        toolbarActions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!quotationManager.id || quotationManager.id < 1}
              onClick={openPreviewDialog}
            >
              <Eye className="h-4 w-4" />
              {tCommon('commands.preview')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSettingsDialogOpen(true)}>
              <Settings2 className="h-4 w-4" />
              {tCommon('commands.settings')}
            </Button>
            <QuotationControlSection
              layout="floating"
              showHeaderLabel={false}
              showConfiguration={false}
              showVisibility={false}
              showInvoices={false}
              allowInvoiceAction={!isBuying}
              quotationPathPrefix={'/selling/quotation'}
              listPath={listPath}
              bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
              currencies={currencies}
              invoices={[]}
              handleSubmitDraft={() => onSubmit(QUOTATION_STATUS.Draft)}
              handleSubmitValidated={() => onSubmit(QUOTATION_STATUS.Validated)}
              reset={globalReset}
              loading={isCreatePending}
            />
          </>
        }
      >
        <QuotationGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          loading={isCreatePending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <QuotationArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
           canUseProductChoices={canUseProductChoices} canReadTaxes={canReadTaxes} requiredReady={requiredReady}/>
        </div>

        <div className="flex justify-end border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <div className="w-full max-w-md">
            <CardTitle className="mb-4 text-base">
              {tInvoicing('quotation.attributes.total')}
            </CardTitle>
            <QuotationFinancialInformation
              subTotal={quotationManager.subTotal}
              total={quotationManager.total}
              currency={quotationManager.currency}
            />
          </div>
        </div>

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">{tInvoicing('quotation.attributes.notes')}</CardTitle>
            <QuotationExtraOptions loading={isCreatePending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('quotation.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <QuotationGeneralConditions
              isPending={isCreatePending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <QuotationExtraOptions mode="files" />
        </div>
      </DocumentEditorShell>
    </div>
  );
};

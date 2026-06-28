import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleQuotationEntry,
  QUOTATION_STATUS,
  Quotation,
  QuotationUploadedFile,
  UpdateQuotationDto
} from '@/types';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useQuotationManager } from './hooks/useQuotationManager';
import { useQuotationArticleManager } from './hooks/useQuotationArticleManager';
import { useQuotationControlManager } from './hooks/useQuotationControlManager';
import _ from 'lodash';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { QuotationExtraOptions } from './form/QuotationExtraOptions';
import { QuotationGeneralConditions } from './form/QuotationGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import { QuotationGeneralInformation } from './form/QuotationGeneralInformation';
import { QuotationArticleManagement } from './form/QuotationArticleManagement';
import { QuotationFinancialInformation } from './form/QuotationFinancialInformation';
import { QuotationControlSection } from './form/QuotationControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { QuotationSettingsDialog } from './dialogs/QuotationSettingsDialog';
import { useIntro } from '@/context/IntroContext';
import { Eye, Settings2 } from 'lucide-react';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import {
  DocumentEditorLead,
  DocumentEditorShell,
  useInitialEditorLoading
} from '@/features/invoicing/shared/editor';
import { DocumentStatusBadge } from '@/features/invoicing/shared/status';
import {
  isStatusEditable,
  SELLING_QUOTATION_EDITABILITY_RULE
} from '@/features/invoicing/shared/models';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface QuotationFormProps {
  className?: string;
  quotationId: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const QuotationUpdateForm = ({
  className,
  quotationId,
  scope = 'selling',
  listPath = '/selling/quotations'
}: QuotationFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  // Stores
  const quotationManager = useQuotationManager();
  const controlManager = useQuotationControlManager();
  const articleManager = useQuotationArticleManager();
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
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  //Fetch options
  const {
    isPending: isFetchPending,
    data: quotationResp,
    refetch: refetchQuotation
  } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () => api.quotation.findOne(parseInt(quotationId)),
    enabled: requiredReady
  });
  const quotation = React.useMemo(() => {
    return quotationResp || null;
  }, [quotationResp]);
  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    setIntro?.(
      quotation?.sequential
        ? `${tInvoicing('quotation.singular')} N° ${quotation?.sequential}`
        : tInvoicing('quotation.singular'),
      ''
    );
    if (quotation?.sequential)
      setRoutes?.([
        {
          title: tCommon('menu.selling'),
          href: '/selling'
        },
        { title: tInvoicing('quotation.plural'), href: listPath },
        { title: tInvoicing('quotation.singular') + ' N° ' + quotation?.sequential }
      ]);
    return () => {
      clearIntro?.();
    };
  }, [router.locale, quotation?.sequential, listPath, scope]);
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
  const editMode = React.useMemo(() => {
    return isStatusEditable(quotation?.status, SELLING_QUOTATION_EDITABILITY_RULE);
  }, [quotation]);
  // Fetch options
  const { firms, isFetchFirmsPending } = useFirmChoice({
    params: firmChoiceParams,
    entityType: isBuying ? 'suppliers' : 'clients',
    context: 'document',
    activityType,
    enabled: requiredReady && canUsePartnerChoices,
    silentForbiddenToast: true
  });
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
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.QUOTATION, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  const initialLoading =
    permissions.isPending ||
    isFetchPending ||
    isFetchFirmsPending ||
    isFetchTaxesPending ||
    isFetchCurrenciesPending ||
    isFetchBankAccountsPending ||
    isFetchDefaultConditionPending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  const digitAfterComma = React.useMemo(() => {
    return quotationManager.currency?.digitAfterComma || 3;
  }, [quotationManager.currency]);
  // perform calculations when the financialy Information are changed
  React.useEffect(() => {
    const zero = dinero({ amount: 0, precision: digitAfterComma });
    // Calculate subTotal
    const subTotal = articleManager.getArticles()?.reduce((acc, article) => {
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
    const total = articleManager.getArticles()?.reduce(
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
  //full quotation setter across multiple stores
  const setQuotationData = (
    data: Partial<
      Quotation & {
        files: QuotationUploadedFile[];
      }
    >
  ) => {
    //quotation infos
    data && quotationManager.setQuotation(data, firms, bankAccounts);
    if (!canReadTreasury) quotationManager.set('bankAccount', null);
    //quotation meta infos
    controlManager.setControls({
      isBankAccountDetailsHidden: !canReadTreasury || !data?.quotationMetaData?.hasBankingDetails,
      isInvoiceAddressHidden: !data?.quotationMetaData?.showInvoiceAddress,
      isDeliveryAddressHidden: !data?.quotationMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.quotationMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.quotationMetaData?.hasGeneralConditions
    });
    //quotation article infos
    articleManager.setArticles(data?.articleQuotationEntries || []);
  };
  //initialized value to detect changement whiie modifying the quotation
  const { isDisabled, globalReset } = useInitializedState({
    data:
      quotation ||
      ({} as Partial<
        Quotation & {
          files: QuotationUploadedFile[];
        }
      >),
    getCurrentData: () => {
      return {
        quotation: quotationManager.getQuotation(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (
      data: Partial<
        Quotation & {
          files: QuotationUploadedFile[];
        }
      >
    ) => {
      setQuotationData(data);
    },
    resetData: () => {
      quotationManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: initialLoading
  });
  //update quotation mutator
  const { mutate: updateQuotation, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { quotation: UpdateQuotationDto; files: File[] }) =>
      api.quotation.update(data.quotation, data.files),
    onSuccess: (data) => {
      if (data.status == QUOTATION_STATUS.Invoiced) {
        toast.success(tInvoicing('quotation.action_invoice_success'));
        // router.push(`/selling/invoice/${data.invoiceId}`);
      } else {
        toast.success(tInvoicing('quotation.action_update_success'));
      }
      refetchQuotation();
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('quotation.action_update_failure')
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
  //update handler
  const onSubmit = (status: QUOTATION_STATUS) => {
    const articlesDto: ArticleQuotationEntry[] = articleManager.getArticles()?.map((article) => ({
      article: {
        title: article?.article?.title,
        description: controlManager.isArticleDescriptionHidden ? '' : article?.article?.description
      },
      quantity: article?.quantity || 0,
      unit_price: article?.unit_price || 0,
      discount: article?.discount || 0,
      discount_type:
        article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      taxes: canReadTaxes ? article?.articleQuotationEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
    }));
    const quotation: UpdateQuotationDto = {
      id: quotationManager?.id,
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
      },
      uploads: quotationManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.quotation.validate(quotation);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateQuotation({
        quotation,
        files: quotationManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };
  //component representation
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
        filename={`${quotationManager.sequential || `quotation-${quotationManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <QuotationSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <QuotationControlSection
          layout="dialog"
          status={quotationManager.status}
          isDataAltered={isDisabled}
          showActions={false}
          showHeaderLabel={false}
          showInvoices={false}
          allowInvoiceAction={!isBuying}
          quotationPathPrefix={'/selling/quotation'}
          detailPathPrefix={'/selling/invoice'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          invoices={quotation?.invoices || []}
          handleSubmit={() => onSubmit(quotationManager.status)}
          handleSubmitDraft={() => onSubmit(QUOTATION_STATUS.Draft)}
          handleSubmitValidated={() => onSubmit(QUOTATION_STATUS.Validated)}
          handleSubmitAccepted={() => onSubmit(QUOTATION_STATUS.Accepted)}
          handleSubmitRejected={() => onSubmit(QUOTATION_STATUS.Rejected)}
          loading={isUpdatingPending}
          refetch={refetchQuotation}
          reset={globalReset}
          edit={editMode}
        />
      </QuotationSettingsDialog>
      <DocumentEditorShell
        disabled={isUpdatingPending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() => router.push(listPath)}
            backLabel={tCommon('commands.back')}
            badge={
              <DocumentStatusBadge
                label={
                  quotationManager.status
                    ? tInvoicing(quotationManager.status)
                    : tCommon('commands.draft')
                }
                tone={quotationManager.status === QUOTATION_STATUS.Draft ? 'draft' : 'neutral'}
              />
            }
          />
        }
        toolbarActions={
          <>
            <Button variant="outline" size="sm" onClick={openPreviewDialog}>
              <Eye className="h-4 w-4" />
              {tCommon('commands.preview')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSettingsDialogOpen(true)}>
              <Settings2 className="h-4 w-4" />
              {tCommon('commands.settings')}
            </Button>
            <QuotationControlSection
              layout="floating"
              status={quotationManager.status}
              isDataAltered={isDisabled}
              showHeaderLabel={false}
              showConfiguration={false}
              showVisibility={false}
              showInvoices={false}
              allowInvoiceAction={!isBuying}
              quotationPathPrefix={'/selling/quotation'}
              detailPathPrefix={'/selling/invoice'}
              listPath={listPath}
              bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
              currencies={currencies}
              invoices={quotation?.invoices || []}
              handleSubmit={() => onSubmit(quotationManager.status)}
              handleSubmitDraft={() => onSubmit(QUOTATION_STATUS.Draft)}
              handleSubmitValidated={() => onSubmit(QUOTATION_STATUS.Validated)}
              handleSubmitAccepted={() => onSubmit(QUOTATION_STATUS.Accepted)}
              handleSubmitRejected={() => onSubmit(QUOTATION_STATUS.Rejected)}
              loading={isUpdatingPending}
              refetch={refetchQuotation}
              reset={globalReset}
              edit={editMode}
            />
          </>
        }
      >
        <QuotationGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          edit={editMode}
          loading={isUpdatingPending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <QuotationArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            edit={editMode}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
            loading={isUpdatingPending}
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
              loading={isUpdatingPending}
              edit={editMode}
            />
          </div>
        </div>

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">{tInvoicing('quotation.attributes.notes')}</CardTitle>
            <QuotationExtraOptions loading={isUpdatingPending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('quotation.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <QuotationGeneralConditions
              isPending={isUpdatingPending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
              edit={editMode}
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

import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleCustomerOrderEntry,
  CUSTOMER_ORDER_STATUS,
  CustomerOrder,
  CustomerOrderUploadedFile,
  UpdateCustomerOrderDto
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
import { useCustomerOrderManager } from './hooks/useCustomerOrderManager';
import { useCustomerOrderArticleManager } from './hooks/useCustomerOrderArticleManager';
import { useCustomerOrderControlManager } from './hooks/useCustomerOrderControlManager';
import _ from 'lodash';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { CustomerOrderExtraOptions } from './form/CustomerOrderExtraOptions';
import { CustomerOrderGeneralConditions } from './form/CustomerOrderGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import { CustomerOrderGeneralInformation } from './form/CustomerOrderGeneralInformation';
import { CustomerOrderArticleManagement } from './form/CustomerOrderArticleManagement';
import { CustomerOrderFinancialInformation } from './form/CustomerOrderFinancialInformation';
import { CustomerOrderControlSection } from './form/CustomerOrderControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { CustomerOrderSettingsDialog } from './dialogs/CustomerOrderSettingsDialog';
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
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface CustomerOrderFormProps {
  className?: string;
  customerOrderId: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const CustomerOrderUpdateForm = ({
  className,
  customerOrderId,
  scope = 'selling',
  listPath = '/selling/customer-orders'
}: CustomerOrderFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  // Stores
  const customerOrderManager = useCustomerOrderManager();
  const controlManager = useCustomerOrderControlManager();
  const articleManager = useCustomerOrderArticleManager();
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
  const documentLabels = useScopedDocumentLabels('customerOrder', scope);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  //Fetch options
  const {
    isPending: isFetchPending,
    data: customerOrderResp,
    refetch: refetchCustomerOrder
  } = useQuery({
    queryKey: ['customerOrder', customerOrderId],
    queryFn: () => api.customerOrder.findOne(parseInt(customerOrderId)),
    enabled: requiredReady
  });
  const customerOrder = React.useMemo(() => {
    return customerOrderResp || null;
  }, [customerOrderResp]);
  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    const displayNumber = documentLabels.displayNumber(customerOrder);
    setIntro?.(
      displayNumber !== '-'
        ? `${documentLabels.singular} N° ${displayNumber}`
        : documentLabels.singular,
      ''
    );
    if (displayNumber !== '-')
      setRoutes?.([
        {
          title: tCommon('menu.selling'),
          href: '/selling'
        },
        { title: documentLabels.plural, href: listPath },
        { title: `${documentLabels.singular} N° ${displayNumber}` }
      ]);
    return () => {
      clearIntro?.();
    };
  }, [
    clearIntro,
    customerOrder,
    documentLabels,
    listPath,
    router.locale,
    scope,
    setIntro,
    setRoutes,
    tCommon
  ]);
  const closePreviewDialog = () => {
    setPreviewDialog(false);
    setPreviewBlob(null);
  };
  const openPreviewDialog = () => {
    if (!customerOrderManager.id || customerOrderManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadCustomerOrderPreview();
  };
  const editMode = React.useMemo(() => {
    const editModeStatuses = [
      CUSTOMER_ORDER_STATUS.Validated,
      CUSTOMER_ORDER_STATUS.Draft,
      CUSTOMER_ORDER_STATUS.Created,
      CUSTOMER_ORDER_STATUS.Cancelled
    ];
    return customerOrder?.status && editModeStatuses.includes(customerOrder?.status);
  }, [customerOrder]);
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
      customerOrderManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.CUSTOMER_ORDER, {
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
    return customerOrderManager.currency?.digitAfterComma || 3;
  }, [customerOrderManager.currency]);
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
    customerOrderManager.set('subTotal', subTotal.toUnit());
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
    if (customerOrderManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(customerOrderManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          customerOrderManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    customerOrderManager.set('total', finalTotal.toUnit());
  }, [articleManager.articles, customerOrderManager.discount, customerOrderManager.discountType]);
  //full customerOrder setter across multiple stores
  const setCustomerOrderData = (
    data: Partial<
      CustomerOrder & {
        files: CustomerOrderUploadedFile[];
      }
    >
  ) => {
    //customerOrder infos
    data && customerOrderManager.setCustomerOrder(data, firms, bankAccounts);
    if (!canReadTreasury) customerOrderManager.set('bankAccount', null);
    //customerOrder meta infos
    controlManager.setControls({
      isBankAccountDetailsHidden: !canReadTreasury || !data?.customerOrderMetaData?.hasBankingDetails,
      isInvoiceAddressHidden: !data?.customerOrderMetaData?.showInvoiceAddress,
      isDeliveryAddressHidden: !data?.customerOrderMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.customerOrderMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.customerOrderMetaData?.hasGeneralConditions
    });
    //customerOrder article infos
    articleManager.setArticles(data?.articleCustomerOrderEntries || []);
  };
  //initialized value to detect changement whiie modifying the customerOrder
  const { isDisabled, globalReset } = useInitializedState({
    data:
      customerOrder ||
      ({} as Partial<
        CustomerOrder & {
          files: CustomerOrderUploadedFile[];
        }
      >),
    getCurrentData: () => {
      return {
        customerOrder: customerOrderManager.getCustomerOrder(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (
      data: Partial<
        CustomerOrder & {
          files: CustomerOrderUploadedFile[];
        }
      >
    ) => {
      setCustomerOrderData(data);
    },
    resetData: () => {
      customerOrderManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: initialLoading
  });
  //update customerOrder mutator
  const { mutate: updateCustomerOrder, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { customerOrder: UpdateCustomerOrderDto; files: File[] }) =>
      api.customerOrder.update(data.customerOrder, data.files),
    onSuccess: (data) => {
      if (data.status == CUSTOMER_ORDER_STATUS.Validated) {
        toast.success(tInvoicing('customerOrder.action_invoice_success'));
        // router.push(`/selling/invoice/${data.invoiceId}`);
      } else {
        toast.success(tInvoicing('customerOrder.action_update_success'));
      }
      refetchCustomerOrder();
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('customerOrder.action_update_failure')
      );
      toast.error(message);
    }
  });
  const { mutate: loadCustomerOrderPreview, isPending: isPreviewPending } = useMutation({
    mutationFn: () => api.customerOrder.preview(customerOrderManager.id || 0, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_preview_failure'))
      );
      closePreviewDialog();
    }
  });
  //update handler
  const onSubmit = (status: CUSTOMER_ORDER_STATUS) => {
    const articlesDto: ArticleCustomerOrderEntry[] = articleManager
      .getArticles()
      ?.map((article) => ({
        article: {
          title: article?.article?.title,
          description: controlManager.isArticleDescriptionHidden
            ? ''
            : article?.article?.description
        },
        quantity: article?.quantity || 0,
        unit_price: article?.unit_price || 0,
        discount: article?.discount || 0,
        discount_type:
          article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
        taxes: canReadTaxes ? article?.articleCustomerOrderEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
      }));
    const customerOrder: UpdateCustomerOrderDto = {
      id: customerOrderManager?.id,
      activityType,
      date: customerOrderManager?.date?.toString(),
      dueDate: customerOrderManager?.dueDate?.toString(),
      reference: isBuying ? customerOrderManager.reference?.trim() : undefined,
      object: customerOrderManager?.object,
      firmId: customerOrderManager?.firm?.id,
      interlocutorId: customerOrderManager?.interlocutor?.id,
      currencyId: customerOrderManager?.currency?.id,
      bankAccountId: canReadTreasury && !controlManager?.isBankAccountDetailsHidden
        ? customerOrderManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? customerOrderManager?.generalConditions
        : '',
      notes: customerOrderManager?.notes,
      articleCustomerOrderEntries: articlesDto,
      discount: customerOrderManager?.discount,
      discount_type:
        customerOrderManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      customerOrderMetaData: {
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showInvoiceAddress: !controlManager?.isInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: canReadTreasury && !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden
      },
      uploads: customerOrderManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.customerOrder.validate(customerOrder);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateCustomerOrder({
        customerOrder,
        files: customerOrderManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };
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

  //component representation
  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={`${documentLabels.displayNumber(customerOrderManager) || `customerOrder-${customerOrderManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <CustomerOrderSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <CustomerOrderControlSection
          layout="dialog"
          status={customerOrderManager.status}
          isDataAltered={isDisabled}
          showActions={false}
          showHeaderLabel={false}
          showInvoices={false}
          allowInvoiceAction
          customerOrderPathPrefix={'/selling/customer-order'}
          detailPathPrefix={'/selling/invoice'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          invoices={customerOrder?.invoices || []}
          handleSubmit={() => onSubmit(customerOrderManager.status)}
          handleSubmitDraft={() => onSubmit(CUSTOMER_ORDER_STATUS.Draft)}
          handleSubmitValidated={() => onSubmit(CUSTOMER_ORDER_STATUS.Created)}
          handleSubmitAccepted={() => onSubmit(CUSTOMER_ORDER_STATUS.Validated)}
          handleSubmitRejected={() => onSubmit(CUSTOMER_ORDER_STATUS.Cancelled)}
          loading={isUpdatingPending}
          refetch={refetchCustomerOrder}
          reset={globalReset}
          edit={editMode}
        />
      </CustomerOrderSettingsDialog>
      {isInitialRenderPending ? (
        <Spinner className="h-screen" show={isInitialRenderPending} />
      ) : (
        <DocumentEditorShell
          disabled={isUpdatingPending}
          toolbarLeading={
            <DocumentEditorLead
              onBack={() => router.push(listPath)}
              backLabel={tCommon('commands.back')}
              badge={
                <DocumentStatusBadge
                  label={
                    customerOrderManager.status
                      ? tInvoicing(customerOrderManager.status)
                      : tCommon('commands.draft')
                  }
                  tone={
                    customerOrderManager.status === CUSTOMER_ORDER_STATUS.Draft
                      ? 'draft'
                      : 'neutral'
                  }
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
              <CustomerOrderControlSection
                layout="floating"
                status={customerOrderManager.status}
                isDataAltered={isDisabled}
                showHeaderLabel={false}
                showConfiguration={false}
                showVisibility={false}
                showInvoices={false}
                allowInvoiceAction
                customerOrderPathPrefix={'/selling/customer-order'}
                detailPathPrefix={'/selling/invoice'}
                listPath={listPath}
                bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
                currencies={currencies}
                invoices={customerOrder?.invoices || []}
                handleSubmit={() => onSubmit(customerOrderManager.status)}
                handleSubmitDraft={() => onSubmit(CUSTOMER_ORDER_STATUS.Draft)}
                handleSubmitValidated={() => onSubmit(CUSTOMER_ORDER_STATUS.Created)}
                handleSubmitAccepted={() => onSubmit(CUSTOMER_ORDER_STATUS.Validated)}
                handleSubmitRejected={() => onSubmit(CUSTOMER_ORDER_STATUS.Cancelled)}
                loading={isUpdatingPending}
                refetch={refetchCustomerOrder}
                reset={globalReset}
                edit={editMode}
              />
            </>
          }
        >
          <CustomerOrderGeneralInformation
            firms={firms}
            isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
            isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
            edit={editMode}
            loading={isUpdatingPending}
          />

          <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <CustomerOrderArticleManagement
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
                {tInvoicing('customerOrder.attributes.total')}
              </CardTitle>
              <CustomerOrderFinancialInformation
                subTotal={customerOrderManager.subTotal}
                total={customerOrderManager.total}
                currency={customerOrderManager.currency}
                loading={isUpdatingPending}
                edit={editMode}
              />
            </div>
          </div>

          <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
            <div className="space-y-3">
              <CardTitle className="text-base">
                {tInvoicing('customerOrder.attributes.notes')}
              </CardTitle>
              <CustomerOrderExtraOptions loading={isUpdatingPending} mode="notes" />
            </div>

            <div className="space-y-3">
              <CardTitle className="text-base">
                {tInvoicing('customerOrder.attributes.general_condition')}
              </CardTitle>
              {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <CustomerOrderGeneralConditions
                isPending={isUpdatingPending}
                hidden={controlManager.isGeneralConditionsHidden}
                defaultCondition={defaultCondition}
                edit={editMode}
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <CustomerOrderExtraOptions mode="files" />
          </div>
        </DocumentEditorShell>
      )}
    </div>
  );
};

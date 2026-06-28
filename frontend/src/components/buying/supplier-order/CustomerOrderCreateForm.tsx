import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleCustomerOrderEntry,
  CreateCustomerOrderDto,
  CUSTOMER_ORDER_STATUS,
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
import { useCustomerOrderManager } from '@/components/buying/supplier-order/hooks/useCustomerOrderManager';
import { useCustomerOrderArticleManager } from './hooks/useCustomerOrderArticleManager';
import useCustomerOrderSocket from './hooks/useCustomerOrderSocket';
import { useCustomerOrderControlManager } from './hooks/useCustomerOrderControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import useCabinet from '@/hooks/content/useCabinet';
import { CustomerOrderExtraOptions } from './form/CustomerOrderExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { CustomerOrderGeneralConditions } from './form/CustomerOrderGeneralConditions';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { CustomerOrderGeneralInformation } from './form/CustomerOrderGeneralInformation';
import { CustomerOrderArticleManagement } from './form/CustomerOrderArticleManagement';
import { CustomerOrderFinancialInformation } from './form/CustomerOrderFinancialInformation';
import { CustomerOrderControlSection } from './form/CustomerOrderControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { CustomerOrderSettingsDialog } from './dialogs/CustomerOrderSettingsDialog';
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
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface CustomerOrderFormProps {
  className?: string;
  firmId?: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const CustomerOrderCreateForm = ({
  className,
  firmId,
  scope = 'buying',
  listPath = '/buying/commandes-fournisseurs'
}: CustomerOrderFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { t: tContacts } = useTranslation('contacts');
  // Stores
  const customerOrderManager = useCustomerOrderManager();
  const articleManager = useCustomerOrderArticleManager();
  const controlManager = useCustomerOrderControlManager();
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
  const documentLabels = useScopedDocumentLabels('customerOrder', scope);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    setIntro?.(documentLabels.newLabel, '');
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
    return () => {
      clearIntro?.();
    };
  }, [
    clearIntro,
    documentLabels.newLabel,
    documentLabels.plural,
    firmId,
    listPath,
    router.locale,
    scope,
    setIntro,
    setRoutes,
    tCommon,
    tContacts
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
      customerOrderManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  // Handle transformation from source
  useDocumentTransformation(
    customerOrderManager.setCustomerOrder,
    articleManager.setArticles,
    controlManager.setControls,
    firms,
    bankAccounts
  );
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.CUSTOMER_ORDER, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  //websocket to listen for server changes related to sequence number
  const { currentSequence, isSequencePending: isCustomerOrderSequencePending } =
    useCustomerOrderSocket(
      isBuying ? Sequences.BUYING_CUSTOMER_ORDER : Sequences.CUSTOMER_ORDER,
      !isBuying,
    requiredReady && canReadDocumentSettings
    );
  //handle Sequential Number
  React.useEffect(() => {
    customerOrderManager.set('sequentialNumber', currentSequence);
    customerOrderManager.set(
      'bankAccount',
      bankAccounts.find((a) => a.isMain)
    );
    customerOrderManager.set('currency', cabinet?.currency);
  }, [currentSequence]);
  // perform calculations when the financialy Information are changed
  const digitAfterComma = React.useMemo(() => {
    return customerOrderManager.currency?.digitAfterComma || 3;
  }, [customerOrderManager.currency]);
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
    customerOrderManager.set('subTotal', subTotal.toUnit());
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
  //create customerOrder mutator
  const { mutate: createCustomerOrder, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { customerOrder: CreateCustomerOrderDto; files: File[] }) =>
      api.customerOrder.create(data.customerOrder, data.files),
    onSuccess: () => {
      if (!firmId) router.push(listPath);
      else router.push(`/contacts/firm/${firmId}/?tab=customerOrders`);
      toast.success(tInvoicing('customerOrder.action_create_success'));
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('customerOrder.action_create_failure')
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
  const initialLoading =
    permissions.isPending ||
    isFetchFirmsPending ||
    isFetchTaxesPending ||
    isFetchCabinetPending ||
    isFetchBankAccountsPending ||
    isFetchCurrenciesPending ||
    isFetchDefaultConditionPending ||
    isCustomerOrderSequencePending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  //Reset Form
  const globalReset = () => {
    customerOrderManager.reset();
    articleManager.reset();
    controlManager.reset();
    customerOrderManager.set('activityType', activityType);
  };
  //side effect to reset the form when the component is mounted
  React.useEffect(() => {
    globalReset();
  }, []);
  //create handler
  const onSubmit = (status: CUSTOMER_ORDER_STATUS) => {
    const articlesDto: ArticleCustomerOrderEntry[] = articleManager
      .getArticles()
      ?.map((article) => ({
        id: article?.id,
        article: {
          title: article?.article?.title,
          description: !controlManager.isArticleDescriptionHidden
            ? article?.article?.description
            : ''
        },
        quantity: article?.quantity,
        unit_price: article?.unit_price,
        discount: article?.discount,
        discount_type:
          article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
        taxes: canReadTaxes
        ? article?.articleCustomerOrderEntryTaxes?.map((entry) => {
            return entry?.tax?.id;
          }) || []
        : []
      }));
    const customerOrder: CreateCustomerOrderDto = {
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
      }
    };
    const validation = api.customerOrder.validate(customerOrder);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete customerOrder.generalConditions;
      createCustomerOrder({
        customerOrder,
        files: customerOrderManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
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
        filename={`${documentLabels.displayNumber(customerOrderManager) || `customerOrder-${customerOrderManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <CustomerOrderSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <CustomerOrderControlSection
          layout="dialog"
          showActions={false}
          showHeaderLabel={false}
          showInvoices={false}
          allowInvoiceAction
          customerOrderPathPrefix={'/buying/commande-fournisseur'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          invoices={[]}
          handleSubmitDraft={() => onSubmit(CUSTOMER_ORDER_STATUS.Draft)}
          handleSubmitValidated={() => onSubmit(CUSTOMER_ORDER_STATUS.Created)}
          reset={globalReset}
          loading={isCreatePending}
        />
      </CustomerOrderSettingsDialog>
      <DocumentEditorShell
        disabled={isCreatePending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() =>
              router.push(firmId ? `/contacts/firm/${firmId}/?tab=customerOrders` : listPath)
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
              disabled={!customerOrderManager.id || customerOrderManager.id < 1}
              onClick={openPreviewDialog}
            >
              <Eye className="h-4 w-4" />
              {tCommon('commands.preview')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSettingsDialogOpen(true)}>
              <Settings2 className="h-4 w-4" />
              {tCommon('commands.settings')}
            </Button>
            <CustomerOrderControlSection
              layout="floating"
              showHeaderLabel={false}
              showConfiguration={false}
              showVisibility={false}
              showInvoices={false}
              allowInvoiceAction
              customerOrderPathPrefix={'/buying/commande-fournisseur'}
              listPath={listPath}
              bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
              currencies={currencies}
              invoices={[]}
              handleSubmitDraft={() => onSubmit(CUSTOMER_ORDER_STATUS.Draft)}
              handleSubmitValidated={() => onSubmit(CUSTOMER_ORDER_STATUS.Created)}
              reset={globalReset}
              loading={isCreatePending}
            />
          </>
        }
      >
        <CustomerOrderGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          loading={isCreatePending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <CustomerOrderArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
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
            />
          </div>
        </div>

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('customerOrder.attributes.notes')}
            </CardTitle>
            <CustomerOrderExtraOptions loading={isCreatePending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('customerOrder.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <CustomerOrderGeneralConditions
              isPending={isCreatePending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <CustomerOrderExtraOptions mode="files" />
        </div>
      </DocumentEditorShell>
    </div>
  );
};

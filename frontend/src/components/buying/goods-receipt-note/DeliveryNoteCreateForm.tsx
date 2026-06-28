import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleDeliveryNoteEntry,
  CreateDeliveryNoteDto,
  DELIVERY_NOTE_STATUS,
  Sequences
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
import { useDeliveryNoteManager } from '@/components/buying/goods-receipt-note/hooks/useDeliveryNoteManager';
import { useDeliveryNoteArticleManager } from './hooks/useDeliveryNoteArticleManager';
import useDeliveryNoteSocket from './hooks/useDeliveryNoteSocket';
import { useDeliveryNoteControlManager } from './hooks/useDeliveryNoteControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import useCabinet from '@/hooks/content/useCabinet';
import { DeliveryNoteExtraOptions } from './form/DeliveryNoteExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { DeliveryNoteGeneralConditions } from './form/DeliveryNoteGeneralConditions';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { DeliveryNoteGeneralInformation } from './form/DeliveryNoteGeneralInformation';
import { DeliveryNoteArticleManagement } from './form/DeliveryNoteArticleManagement';
import { DeliveryNoteFinancialInformation } from './form/DeliveryNoteFinancialInformation';
import { DeliveryNoteControlSection } from './form/DeliveryNoteControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { DeliveryNoteSettingsDialog } from './dialogs/DeliveryNoteSettingsDialog';
import { useIntro } from '@/context/IntroContext';
import { useDocumentTransformation } from '@/hooks/content/useDocumentTransformation';
import { Check, Eye, FileText, Settings2 } from 'lucide-react';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import { TransportCustomFields } from '@/features/invoicing/shared/TransportCustomFields';
import {
  DocumentEditorActionGroup,
  DocumentEditorLead,
  DocumentEditorShell,
  type DocumentEditorActionModel,
  useInitialEditorLoading
} from '@/features/invoicing/shared/editor';
import { DocumentStatusBadge } from '@/features/invoicing/shared/status';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface DeliveryNoteFormProps {
  className?: string;
  firmId?: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const DeliveryNoteCreateForm = ({
  className,
  firmId,
  scope = 'buying',
  listPath = '/buying/bons-reception'
}: DeliveryNoteFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { t: tContacts } = useTranslation('contacts');
  // Stores
  const deliveryNoteManager = useDeliveryNoteManager();
  const articleManager = useDeliveryNoteArticleManager();
  const controlManager = useDeliveryNoteControlManager();
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
  const documentLabels = useScopedDocumentLabels('deliveryNote', scope);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const showPrices = !controlManager.isPricesHidden;
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
    if (!deliveryNoteManager.id || deliveryNoteManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadDeliveryNotePreview();
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
      deliveryNoteManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  // Handle transformation from source
  useDocumentTransformation(
    deliveryNoteManager.setDeliveryNote,
    articleManager.setArticles,
    controlManager.setControls,
    firms,
    bankAccounts
  );
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.DELIVERY_NOTE, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  //websocket to listen for server changes related to sequence number
  const { currentSequence, isSequencePending: isDeliveryNoteSequencePending } =
    useDeliveryNoteSocket(
      isBuying ? Sequences.BUYING_DELIVERY_NOTE : Sequences.DELIVERY_NOTE,
      !isBuying,
    requiredReady && canReadDocumentSettings
    );
  //handle Sequential Number
  React.useEffect(() => {
    deliveryNoteManager.set('sequentialNumber', currentSequence);
    deliveryNoteManager.set(
      'bankAccount',
      bankAccounts.find((a) => a.isMain)
    );
    deliveryNoteManager.set('currency', cabinet?.currency);
  }, [currentSequence]);
  // perform calculations when the financialy Information are changed
  const digitAfterComma = React.useMemo(() => {
    return deliveryNoteManager.currency?.digitAfterComma || 3;
  }, [deliveryNoteManager.currency]);
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
    deliveryNoteManager.set('subTotal', subTotal.toUnit());
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
    if (deliveryNoteManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(deliveryNoteManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          deliveryNoteManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    deliveryNoteManager.set('total', finalTotal.toUnit());
  }, [articleManager.articles, deliveryNoteManager.discount, deliveryNoteManager.discountType]);
  //create deliveryNote mutator
  const { mutate: createDeliveryNote, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { deliveryNote: CreateDeliveryNoteDto; files: File[] }) =>
      api.deliveryNote.create(data.deliveryNote, data.files),
    onSuccess: () => {
      if (!firmId) router.push(listPath);
      else router.push(`/contacts/firm/${firmId}/?tab=deliveryNotes`);
      toast.success(tInvoicing('deliveryNote.action_create_success'));
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('deliveryNote.action_create_failure')
      );
      toast.error(message);
    }
  });
  const { mutate: loadDeliveryNotePreview, isPending: isPreviewPending } = useMutation({
    mutationFn: () => api.deliveryNote.preview(deliveryNoteManager.id || 0, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_preview_failure'))
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
    isDeliveryNoteSequencePending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  //Reset Form
  const globalReset = () => {
    deliveryNoteManager.reset();
    articleManager.reset();
    controlManager.reset();
    deliveryNoteManager.set('activityType', activityType);
  };
  //side effect to reset the form when the component is mounted
  React.useEffect(() => {
    globalReset();
  }, []);
  //create handler
  const onSubmit = (status: DELIVERY_NOTE_STATUS) => {
    const articlesDto: ArticleDeliveryNoteEntry[] = articleManager
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
        ? article?.articleDeliveryNoteEntryTaxes?.map((entry) => {
            return entry?.tax?.id;
          }) || []
        : []
      }));
    const deliveryNote: CreateDeliveryNoteDto = {
      activityType,
      date: deliveryNoteManager?.date?.toString(),
      dueDate: deliveryNoteManager?.dueDate?.toString(),
      reference: isBuying ? deliveryNoteManager.reference?.trim() : undefined,
      object: deliveryNoteManager?.object,
      firmId: deliveryNoteManager?.firm?.id,
      interlocutorId: deliveryNoteManager?.interlocutor?.id,
      currencyId: deliveryNoteManager?.currency?.id,
      bankAccountId: canReadTreasury && !controlManager?.isBankAccountDetailsHidden
        ? deliveryNoteManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? deliveryNoteManager?.generalConditions
        : '',
      notes: deliveryNoteManager?.notes,
      articleDeliveryNoteEntries: articlesDto,
      discount: deliveryNoteManager?.discount,
      discount_type:
        deliveryNoteManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      deliveryNoteMetaData: {
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showInvoiceAddress: !controlManager?.isInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: canReadTreasury && !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden,
        showPrices,
        vehicleRegistration: deliveryNoteManager.vehicleRegistration,
        driverName: deliveryNoteManager.driverName
      }
    };
    const validation = api.deliveryNote.validate(deliveryNote);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete deliveryNote.generalConditions;
      createDeliveryNote({
        deliveryNote,
        files: deliveryNoteManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
      globalReset();
    }
  };
  //component representation
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

  const createActions: DocumentEditorActionModel[] = [
    {
      id: 'draft',
      label: tCommon('commands.draft'),
      icon: FileText,
      disabled: isCreatePending,
      onClick: () => onSubmit(DELIVERY_NOTE_STATUS.Draft)
    },
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !deliveryNoteManager.id || deliveryNoteManager.id < 1 || isCreatePending,
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
      onClick: () => onSubmit(DELIVERY_NOTE_STATUS.Created)
    }
  ];
  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={`${documentLabels.displayNumber(deliveryNoteManager) || `deliveryNote-${deliveryNoteManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <DeliveryNoteSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DeliveryNoteControlSection
          layout="dialog"
          showActions={false}
          showHeaderLabel={false}
          showInvoices={false}
          allowInvoiceAction
          deliveryNotePathPrefix={'/buying/bon-reception'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          invoices={[]}
          handleSubmitDraft={() => onSubmit(DELIVERY_NOTE_STATUS.Draft)}
          handleSubmitCreated={() => onSubmit(DELIVERY_NOTE_STATUS.Created)}
          reset={globalReset}
          loading={isCreatePending}
        />
      </DeliveryNoteSettingsDialog>
      <DocumentEditorShell
        disabled={isCreatePending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() =>
              router.push(firmId ? `/contacts/firm/${firmId}/?tab=deliveryNotes` : listPath)
            }
            backLabel={tCommon('commands.back')}
            badge={<DocumentStatusBadge label={tCommon('commands.draft')} tone="draft" />}
          />
        }
        toolbarActions={<DocumentEditorActionGroup actions={createActions} />}
      >
        <DeliveryNoteGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          loading={isCreatePending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <DeliveryNoteArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
            showPrices={showPrices}
           canUseProductChoices={canUseProductChoices} canReadTaxes={canReadTaxes} requiredReady={requiredReady}/>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <TransportCustomFields
            translationKey="deliveryNote"
            vehicleRegistration={deliveryNoteManager.vehicleRegistration}
            driverName={deliveryNoteManager.driverName}
            onVehicleRegistrationChange={(value) =>
              deliveryNoteManager.set('vehicleRegistration', value)
            }
            onDriverNameChange={(value) => deliveryNoteManager.set('driverName', value)}
          />
        </div>

        {showPrices && (
          <div className="flex justify-end border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <div className="w-full max-w-md">
              <CardTitle className="mb-4 text-base">
                {tInvoicing('deliveryNote.attributes.total')}
              </CardTitle>
              <DeliveryNoteFinancialInformation
                subTotal={deliveryNoteManager.subTotal}
                total={deliveryNoteManager.total}
                currency={deliveryNoteManager.currency}
              />
            </div>
          </div>
        )}

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('deliveryNote.attributes.notes')}
            </CardTitle>
            <DeliveryNoteExtraOptions loading={isCreatePending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('deliveryNote.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <DeliveryNoteGeneralConditions
              isPending={isCreatePending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <DeliveryNoteExtraOptions mode="files" />
        </div>
      </DocumentEditorShell>
    </div>
  );
};

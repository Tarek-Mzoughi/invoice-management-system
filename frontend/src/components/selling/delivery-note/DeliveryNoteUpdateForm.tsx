import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleDeliveryNoteEntry,
  DELIVERY_NOTE_STATUS,
  DeliveryNote,
  DeliveryNoteUploadedFile,
  UpdateDeliveryNoteDto
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
import { useDeliveryNoteManager } from './hooks/useDeliveryNoteManager';
import { useDeliveryNoteArticleManager } from './hooks/useDeliveryNoteArticleManager';
import { useDeliveryNoteControlManager } from './hooks/useDeliveryNoteControlManager';
import _ from 'lodash';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { DeliveryNoteExtraOptions } from './form/DeliveryNoteExtraOptions';
import { DeliveryNoteGeneralConditions } from './form/DeliveryNoteGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import { DeliveryNoteGeneralInformation } from './form/DeliveryNoteGeneralInformation';
import { DeliveryNoteArticleManagement } from './form/DeliveryNoteArticleManagement';
import { DeliveryNoteFinancialInformation } from './form/DeliveryNoteFinancialInformation';
import { DeliveryNoteControlSection } from './form/DeliveryNoteControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { DeliveryNoteSettingsDialog } from './dialogs/DeliveryNoteSettingsDialog';
import { DeliveryNoteStatusDialog } from './dialogs/DeliveryNoteStatusDialog';
import { useIntro } from '@/context/IntroContext';
import { Check, ChevronDown, Copy, Download, Eye, RefreshCw, Save, Settings2 } from 'lucide-react';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import { TransportCustomFields } from '@/features/invoicing/shared/TransportCustomFields';
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
interface DeliveryNoteFormProps {
  className?: string;
  deliveryNoteId: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const DeliveryNoteUpdateForm = ({
  className,
  deliveryNoteId,
  scope = 'selling',
  listPath = '/selling/delivery-notes'
}: DeliveryNoteFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  // Stores
  const deliveryNoteManager = useDeliveryNoteManager();
  const controlManager = useDeliveryNoteControlManager();
  const articleManager = useDeliveryNoteArticleManager();
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
  const documentLabels = useScopedDocumentLabels('deliveryNote', scope);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const showPrices = !controlManager.isPricesHidden;
  //Fetch options
  const {
    isPending: isFetchPending,
    data: deliveryNoteResp,
    refetch: refetchDeliveryNote
  } = useQuery({
    queryKey: ['deliveryNote', deliveryNoteId],
    queryFn: () => api.deliveryNote.findOne(parseInt(deliveryNoteId)),
    enabled: requiredReady
  });
  const deliveryNote = React.useMemo(() => {
    return deliveryNoteResp || null;
  }, [deliveryNoteResp]);
  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    const displayNumber = documentLabels.displayNumber(deliveryNote);
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
    deliveryNote,
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
    if (!deliveryNoteManager.id || deliveryNoteManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadDeliveryNotePreview();
  };
  //recognize if the form can be edited
  const editMode = React.useMemo(() => {
    const editModeStatuses = [DELIVERY_NOTE_STATUS.Draft, DELIVERY_NOTE_STATUS.Created];
    return deliveryNote?.status && editModeStatuses.includes(deliveryNote?.status);
  }, [deliveryNote]);
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
      deliveryNoteManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.DELIVERY_NOTE, {
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
    return deliveryNoteManager.currency?.digitAfterComma || 3;
  }, [deliveryNoteManager.currency]);
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
    deliveryNoteManager.set('subTotal', subTotal.toUnit());
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
  //full deliveryNote setter across multiple stores
  const setDeliveryNoteData = (
    data: Partial<
      DeliveryNote & {
        files: DeliveryNoteUploadedFile[];
      }
    >
  ) => {
    //deliveryNote infos
    data && deliveryNoteManager.setDeliveryNote(data, firms, bankAccounts);
    if (!canReadTreasury) deliveryNoteManager.set('bankAccount', null);
    //deliveryNote meta infos
    controlManager.setControls({
      isBankAccountDetailsHidden: !canReadTreasury || !data?.deliveryNoteMetaData?.hasBankingDetails,
      isInvoiceAddressHidden: !data?.deliveryNoteMetaData?.showInvoiceAddress,
      isDeliveryAddressHidden: !data?.deliveryNoteMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.deliveryNoteMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.deliveryNoteMetaData?.hasGeneralConditions,
      isPricesHidden: data?.deliveryNoteMetaData?.showPrices === false
    });
    //deliveryNote article infos
    articleManager.setArticles(data?.articleDeliveryNoteEntries || []);
  };
  //initialized value to detect changement whiie modifying the deliveryNote
  const { isDisabled, globalReset } = useInitializedState({
    data:
      deliveryNote ||
      ({} as Partial<
        DeliveryNote & {
          files: DeliveryNoteUploadedFile[];
        }
      >),
    getCurrentData: () => {
      return {
        deliveryNote: deliveryNoteManager.getDeliveryNote(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (
      data: Partial<
        DeliveryNote & {
          files: DeliveryNoteUploadedFile[];
        }
      >
    ) => {
      setDeliveryNoteData(data);
    },
    resetData: () => {
      deliveryNoteManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: initialLoading
  });
  //update deliveryNote mutator
  const { mutate: updateDeliveryNote, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { deliveryNote: UpdateDeliveryNoteDto; files: File[] }) =>
      api.deliveryNote.update(data.deliveryNote, data.files),
    onSuccess: (data) => {
      toast.success(tInvoicing('deliveryNote.action_update_success'));
      refetchDeliveryNote();
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('deliveryNote.action_update_failure')
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
  const { mutate: downloadDeliveryNote, isPending: isDownloadPending } = useMutation({
    mutationFn: () => api.deliveryNote.download(deliveryNoteManager.id || 0, 'template1'),
    onSuccess: () => {
      toast.success(tInvoicing('deliveryNote.action_download_success'));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_download_failure'))
      );
    }
  });
  const { mutate: duplicateDeliveryNote, isPending: isDuplicatePending } = useMutation({
    mutationFn: () =>
      api.deliveryNote.duplicate({
        id: deliveryNoteManager.id || 0,
        includeFiles: false
      }),
    onSuccess: (data) => {
      toast.success(tInvoicing('deliveryNote.action_duplicate_success'));
      router.push(`${'/selling/delivery-note'}/${data.id}`);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_duplicate_failure'))
      );
    }
  });
  const { mutate: updateDeliveryNoteStatus, isPending: isStatusPending } = useMutation({
    mutationFn: (status: DELIVERY_NOTE_STATUS) =>
      api.deliveryNote.updateStatus(deliveryNoteManager.id || 0, status),
    onSuccess: () => {
      toast.success(tInvoicing('deliveryNote.action_update_success'));
      setStatusDialogOpen(false);
      refetchDeliveryNote();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_update_failure'))
      );
    }
  });
  //update handler
  const onSubmit = (status: DELIVERY_NOTE_STATUS) => {
    const articlesDto: ArticleDeliveryNoteEntry[] = articleManager
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
        taxes: canReadTaxes ? article?.articleDeliveryNoteEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
      }));
    const deliveryNote: UpdateDeliveryNoteDto = {
      id: deliveryNoteManager?.id,
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
      },
      uploads: deliveryNoteManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.deliveryNote.validate(deliveryNote);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateDeliveryNote({
        deliveryNote,
        files: deliveryNoteManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
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
          action="update"
          canAccessDocumentAction={permissions.canAccessDocumentAction}
          className="mx-auto w-full max-w-3xl space-y-3 px-4"
        />
      </div>
    );
  }

  const isToolbarPending =
    isUpdatingPending || isDownloadPending || isDuplicatePending || isStatusPending;
  const isDraftStatus = deliveryNoteManager.status === DELIVERY_NOTE_STATUS.Draft;
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
      <DeliveryNoteStatusDialog
        open={statusDialogOpen}
        deliveryNote={deliveryNote}
        isPending={isStatusPending}
        callback={updateDeliveryNoteStatus}
        onClose={() => setStatusDialogOpen(false)}
      />
      <DeliveryNoteSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DeliveryNoteControlSection
          layout="dialog"
          status={deliveryNoteManager.status}
          isDataAltered={isDisabled}
          showActions={false}
          showHeaderLabel={false}
          showInvoices={false}
          allowInvoiceAction
          deliveryNotePathPrefix={'/selling/delivery-note'}
          detailPathPrefix={'/selling/invoice'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          invoices={deliveryNote?.invoices || []}
          handleSubmit={() => onSubmit(deliveryNoteManager.status)}
          handleSubmitDraft={() => onSubmit(DELIVERY_NOTE_STATUS.Draft)}
          handleSubmitCreated={() => onSubmit(DELIVERY_NOTE_STATUS.Created)}
          handleSubmitDelivered={() => onSubmit(DELIVERY_NOTE_STATUS.Delivered)}
          handleSubmitCancelled={() => onSubmit(DELIVERY_NOTE_STATUS.Cancelled)}
          loading={isUpdatingPending}
          refetch={refetchDeliveryNote}
          reset={globalReset}
          edit={editMode}
        />
      </DeliveryNoteSettingsDialog>
      <DocumentEditorShell
        disabled={isUpdatingPending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() => router.push(listPath)}
            backLabel={tCommon('commands.back')}
            badge={
              <DocumentStatusBadge
                label={
                  deliveryNoteManager.status
                    ? tInvoicing(deliveryNoteManager.status)
                    : tCommon('commands.draft')
                }
                tone={
                  deliveryNoteManager.status === DELIVERY_NOTE_STATUS.Draft ? 'draft' : 'neutral'
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
            {isDraftStatus ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!editMode || isDisabled || isToolbarPending}
                  onClick={() => onSubmit(deliveryNoteManager.status || DELIVERY_NOTE_STATUS.Draft)}
                >
                  <Save className="h-4 w-4" />
                  {tCommon('commands.save')}
                </Button>
                <Button
                  size="sm"
                  disabled={!editMode || isToolbarPending}
                  onClick={() => onSubmit(DELIVERY_NOTE_STATUS.Created)}
                >
                  <Check className="h-4 w-4" />
                  {tCommon('commands.validate')}
                </Button>
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isToolbarPending}>
                      {tCommon('commands.actions')}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="gap-2" onClick={() => setStatusDialogOpen(true)}>
                      <RefreshCw className="h-4 w-4" />
                      {tInvoicing('deliveryNote.details.change_status')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => downloadDeliveryNote()}>
                      <Download className="h-4 w-4" />
                      {tInvoicing('deliveryNote.details.download_document')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => duplicateDeliveryNote()}>
                      <Copy className="h-4 w-4" />
                      {tCommon('commands.duplicate')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  disabled={!editMode || isDisabled || isToolbarPending}
                  onClick={() =>
                    onSubmit(deliveryNoteManager.status || DELIVERY_NOTE_STATUS.Created)
                  }
                >
                  <Save className="h-4 w-4" />
                  {tCommon('commands.update')}
                </Button>
              </>
            )}
          </>
        }
      >
        <DeliveryNoteGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          edit={editMode}
          loading={isUpdatingPending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <DeliveryNoteArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            edit={editMode}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
            showPrices={showPrices}
            loading={isUpdatingPending}
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
            disabled={!editMode}
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
                loading={isUpdatingPending}
                edit={editMode}
              />
            </div>
          </div>
        )}

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('deliveryNote.attributes.notes')}
            </CardTitle>
            <DeliveryNoteExtraOptions loading={isUpdatingPending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('deliveryNote.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <DeliveryNoteGeneralConditions
              isPending={isUpdatingPending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
              edit={editMode}
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

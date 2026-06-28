import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleReturnNoteEntry,
  CreateReturnNoteDto,
  RETURN_NOTE_STATUS,
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
import { useReturnNoteManager } from '@/components/buying/supplier-return-note/hooks/useReturnNoteManager';
import { useReturnNoteArticleManager } from './hooks/useReturnNoteArticleManager';
import useReturnNoteSocket from './hooks/useReturnNoteSocket';
import { useReturnNoteControlManager } from './hooks/useReturnNoteControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import useCabinet from '@/hooks/content/useCabinet';
import { ReturnNoteExtraOptions } from './form/ReturnNoteExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { ReturnNoteGeneralConditions } from './form/ReturnNoteGeneralConditions';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { ReturnNoteGeneralInformation } from './form/ReturnNoteGeneralInformation';
import { ReturnNoteArticleManagement } from './form/ReturnNoteArticleManagement';
import { ReturnNoteFinancialInformation } from './form/ReturnNoteFinancialInformation';
import { ReturnNoteControlSection } from './form/ReturnNoteControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { ReturnNoteSettingsDialog } from './dialogs/ReturnNoteSettingsDialog';
import { useIntro } from '@/context/IntroContext';
import { useDocumentTransformation } from '@/hooks/content/useDocumentTransformation';
import { Check, Eye, FileText, Settings2 } from 'lucide-react';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
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
interface ReturnNoteFormProps {
  className?: string;
  firmId?: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const ReturnNoteCreateForm = ({
  className,
  firmId,
  scope = 'buying',
  listPath = '/buying/retours-fournisseurs'
}: ReturnNoteFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { t: tContacts } = useTranslation('contacts');
  // Stores
  const returnNoteManager = useReturnNoteManager();
  const articleManager = useReturnNoteArticleManager();
  const controlManager = useReturnNoteControlManager();
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
  const documentLabels = useScopedDocumentLabels('returnNote', scope);
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
    if (!returnNoteManager.id || returnNoteManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadReturnNotePreview();
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
      returnNoteManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.RETURN_NOTE, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  //websocket to listen for server changes related to sequence number
  const { currentSequence, isSequencePending: isReturnNoteSequencePending } = useReturnNoteSocket(
    isBuying ? Sequences.BUYING_RETURN_NOTE : Sequences.RETURN_NOTE,
    !isBuying,
    requiredReady && canReadDocumentSettings
  );
  //handle Sequential Number
  React.useEffect(() => {
    returnNoteManager.set('sequentialNumber', currentSequence);
    returnNoteManager.set(
      'bankAccount',
      bankAccounts.find((a) => a.isMain)
    );
    returnNoteManager.set('currency', cabinet?.currency);
  }, [currentSequence]);
  // perform calculations when the financialy Information are changed
  const digitAfterComma = React.useMemo(() => {
    return returnNoteManager.currency?.digitAfterComma || 3;
  }, [returnNoteManager.currency]);
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
    returnNoteManager.set('subTotal', subTotal.toUnit());
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
    if (returnNoteManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(returnNoteManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          returnNoteManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    returnNoteManager.set('total', finalTotal.toUnit());
  }, [articleManager.articles, returnNoteManager.discount, returnNoteManager.discountType]);
  //create returnNote mutator
  const { mutate: createReturnNote, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { returnNote: CreateReturnNoteDto; files: File[] }) =>
      api.returnNote.create(data.returnNote, data.files),
    onSuccess: () => {
      if (!firmId) router.push(listPath);
      else router.push(`/contacts/firm/${firmId}/?tab=returnNotes`);
      toast.success(tInvoicing('returnNote.action_create_success'));
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('returnNote.action_create_failure')
      );
      toast.error(message);
    }
  });
  const { mutate: loadReturnNotePreview, isPending: isPreviewPending } = useMutation({
    mutationFn: () => api.returnNote.preview(returnNoteManager.id || 0, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('returnNote.action_preview_failure'))
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
    isReturnNoteSequencePending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  //Reset Form
  const globalReset = () => {
    returnNoteManager.reset();
    articleManager.reset();
    controlManager.reset();
    returnNoteManager.set('activityType', activityType);
  };
  //side effect to reset the form when the component is mounted
  React.useEffect(() => {
    globalReset();
  }, []);
  //create handler
  const onSubmit = (status: RETURN_NOTE_STATUS) => {
    const articlesDto: ArticleReturnNoteEntry[] = articleManager.getArticles()?.map((article) => ({
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
        ? article?.articleReturnNoteEntryTaxes?.map((entry) => {
            return entry?.tax?.id;
          }) || []
        : []
    }));
    const returnNote: CreateReturnNoteDto = {
      activityType,
      date: returnNoteManager?.date?.toString(),
      dueDate: returnNoteManager?.dueDate?.toString(),
      reference: isBuying ? returnNoteManager.reference?.trim() : undefined,
      object: returnNoteManager?.object,
      firmId: returnNoteManager?.firm?.id,
      interlocutorId: returnNoteManager?.interlocutor?.id,
      currencyId: returnNoteManager?.currency?.id,
      bankAccountId: canReadTreasury && !controlManager?.isBankAccountDetailsHidden
        ? returnNoteManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? returnNoteManager?.generalConditions
        : '',
      notes: returnNoteManager?.notes,
      articleReturnNoteEntries: articlesDto,
      discount: returnNoteManager?.discount,
      discount_type:
        returnNoteManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      returnNoteMetaData: {
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showInvoiceAddress: !controlManager?.isInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: canReadTreasury && !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden,
        showPrices,
        vehicleRegistration: returnNoteManager.vehicleRegistration,
        driverName: returnNoteManager.driverName
      }
    };
    const validation = api.returnNote.validate(returnNote);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete returnNote.generalConditions;
      createReturnNote({
        returnNote,
        files: returnNoteManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
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
      onClick: () => onSubmit(RETURN_NOTE_STATUS.Draft)
    },
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !returnNoteManager.id || returnNoteManager.id < 1 || isCreatePending,
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
      onClick: () => onSubmit(RETURN_NOTE_STATUS.Validated)
    }
  ];
  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={`${documentLabels.displayNumber(returnNoteManager) || `returnNote-${returnNoteManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <ReturnNoteSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <ReturnNoteControlSection
          layout="dialog"
          showActions={false}
          showHeaderLabel={false}
          showInvoices={false}
          allowInvoiceAction={!isBuying}
          returnNotePathPrefix={'/buying/retour-fournisseur'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          invoices={[]}
          handleSubmitDraft={() => onSubmit(RETURN_NOTE_STATUS.Draft)}
          handleSubmitValidated={() => onSubmit(RETURN_NOTE_STATUS.Validated)}
          handleSubmitSent={() => onSubmit(RETURN_NOTE_STATUS.Sent)}
          reset={globalReset}
          loading={isCreatePending}
        />
      </ReturnNoteSettingsDialog>
      <DocumentEditorShell
        disabled={isCreatePending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() =>
              router.push(firmId ? `/contacts/firm/${firmId}/?tab=returnNotes` : listPath)
            }
            backLabel={tCommon('commands.back')}
            badge={<DocumentStatusBadge label={tCommon('commands.draft')} tone="draft" />}
          />
        }
        toolbarActions={<DocumentEditorActionGroup actions={createActions} />}
      >
        <ReturnNoteGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          loading={isCreatePending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <ReturnNoteArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
            showPrices={showPrices}
           canUseProductChoices={canUseProductChoices} canReadTaxes={canReadTaxes} requiredReady={requiredReady}/>
        </div>

        {showPrices && (
          <div className="flex justify-end border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <div className="w-full max-w-md">
              <CardTitle className="mb-4 text-base">
                {tInvoicing('returnNote.attributes.total')}
              </CardTitle>
              <ReturnNoteFinancialInformation
                subTotal={returnNoteManager.subTotal}
                total={returnNoteManager.total}
                currency={returnNoteManager.currency}
              />
            </div>
          </div>
        )}

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">{tInvoicing('returnNote.attributes.notes')}</CardTitle>
            <ReturnNoteExtraOptions loading={isCreatePending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('returnNote.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <ReturnNoteGeneralConditions
              isPending={isCreatePending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <ReturnNoteExtraOptions mode="files" />
        </div>
      </DocumentEditorShell>
    </div>
  );
};

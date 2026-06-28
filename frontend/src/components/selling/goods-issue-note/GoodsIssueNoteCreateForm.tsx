import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleGoodsIssueNoteEntry,
  CreateGoodsIssueNoteDto,
  GOODS_ISSUE_NOTE_STATUS,
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
import { useGoodsIssueNoteManager } from '@/components/selling/goods-issue-note/hooks/useGoodsIssueNoteManager';
import { useGoodsIssueNoteArticleManager } from './hooks/useGoodsIssueNoteArticleManager';
import useGoodsIssueNoteSocket from './hooks/useGoodsIssueNoteSocket';
import { useGoodsIssueNoteControlManager } from './hooks/useGoodsIssueNoteControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import useCabinet from '@/hooks/content/useCabinet';
import { GoodsIssueNoteExtraOptions } from './form/GoodsIssueNoteExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { GoodsIssueNoteGeneralConditions } from './form/GoodsIssueNoteGeneralConditions';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { GoodsIssueNoteGeneralInformation } from './form/GoodsIssueNoteGeneralInformation';
import { GoodsIssueNoteArticleManagement } from './form/GoodsIssueNoteArticleManagement';
import { GoodsIssueNoteFinancialInformation } from './form/GoodsIssueNoteFinancialInformation';
import { GoodsIssueNoteControlSection } from './form/GoodsIssueNoteControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { GoodsIssueNoteSettingsDialog } from './dialogs/GoodsIssueNoteSettingsDialog';
import { useIntro } from '@/context/IntroContext';
import { useDocumentTransformation } from '@/hooks/content/useDocumentTransformation';
import { Eye, Settings2 } from 'lucide-react';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import { TransportCustomFields } from '@/features/invoicing/shared/TransportCustomFields';
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
interface GoodsIssueNoteFormProps {
  className?: string;
  firmId?: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const GoodsIssueNoteCreateForm = ({
  className,
  firmId,
  scope = 'selling',
  listPath = '/selling/goods-issue-notes'
}: GoodsIssueNoteFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { t: tContacts } = useTranslation('contacts');
  // Stores
  const goodsIssueNoteManager = useGoodsIssueNoteManager();
  const articleManager = useGoodsIssueNoteArticleManager();
  const controlManager = useGoodsIssueNoteControlManager();
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
  const showPrices = !controlManager.isPricesHidden;
  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    setIntro?.(tInvoicing('goodsIssueNote.new'), '');
    setRoutes?.(
      !firmId
        ? [
            {
              title: tCommon('menu.selling'),
              href: '/selling'
            },
            { title: tInvoicing('goodsIssueNote.plural'), href: listPath },
            { title: tInvoicing('goodsIssueNote.new') }
          ]
        : [
            { title: tCommon('menu.contacts'), href: '/contacts' },
            { title: tContacts('firm.plural'), href: '/contacts/firms' },
            {
              title: `${tContacts('firm.singular')} N°${firmId}`,
              href: `/contacts/firm/${firmId}?tab=entreprise`
            },
            { title: tInvoicing('goodsIssueNote.new') }
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
    if (!goodsIssueNoteManager.id || goodsIssueNoteManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadGoodsIssueNotePreview();
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
      goodsIssueNoteManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  // Handle transformation from source
  useDocumentTransformation(
    goodsIssueNoteManager.setGoodsIssueNote,
    articleManager.setArticles,
    controlManager.setControls,
    firms,
    bankAccounts
  );
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.GOODS_ISSUE_NOTE, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
  //websocket to listen for server changes related to sequence number
  const { currentSequence, isSequencePending: isGoodsIssueNoteSequencePending } =
    useGoodsIssueNoteSocket(
      isBuying ? Sequences.BUYING_GOODS_ISSUE_NOTE : Sequences.GOODS_ISSUE_NOTE,
      !isBuying,
    requiredReady && canReadDocumentSettings
    );
  //handle Sequential Number
  React.useEffect(() => {
    goodsIssueNoteManager.set('sequentialNumber', currentSequence);
    goodsIssueNoteManager.set(
      'bankAccount',
      bankAccounts.find((a) => a.isMain)
    );
    goodsIssueNoteManager.set('currency', cabinet?.currency);
  }, [currentSequence]);
  // perform calculations when the financialy Information are changed
  const digitAfterComma = React.useMemo(() => {
    return goodsIssueNoteManager.currency?.digitAfterComma || 3;
  }, [goodsIssueNoteManager.currency]);
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
    goodsIssueNoteManager.set('subTotal', subTotal.toUnit());
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
    if (goodsIssueNoteManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(goodsIssueNoteManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          goodsIssueNoteManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    goodsIssueNoteManager.set('total', finalTotal.toUnit());
  }, [articleManager.articles, goodsIssueNoteManager.discount, goodsIssueNoteManager.discountType]);
  //create goodsIssueNote mutator
  const { mutate: createGoodsIssueNote, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { goodsIssueNote: CreateGoodsIssueNoteDto; files: File[] }) =>
      api.goodsIssueNote.create(data.goodsIssueNote, data.files),
    onSuccess: () => {
      if (!firmId) router.push(listPath);
      else router.push(`/contacts/firm/${firmId}/?tab=goodsIssueNotes`);
      toast.success(tInvoicing('goodsIssueNote.action_create_success'));
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('goodsIssueNote.action_create_failure')
      );
      toast.error(message);
    }
  });
  const { mutate: loadGoodsIssueNotePreview, isPending: isPreviewPending } = useMutation({
    mutationFn: () => api.goodsIssueNote.preview(goodsIssueNoteManager.id || 0, 'template1'),
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('goodsIssueNote.action_preview_failure'))
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
    isGoodsIssueNoteSequencePending ||
    !commonReady ||
    !invoicingReady;
  const isInitialRenderPending = useInitialEditorLoading(initialLoading);
  //Reset Form
  const globalReset = () => {
    goodsIssueNoteManager.reset();
    articleManager.reset();
    controlManager.reset();
    goodsIssueNoteManager.set('activityType', activityType);
  };
  //side effect to reset the form when the component is mounted
  React.useEffect(() => {
    globalReset();
  }, []);
  //create handler
  const onSubmit = (status: GOODS_ISSUE_NOTE_STATUS) => {
    const articlesDto: ArticleGoodsIssueNoteEntry[] = articleManager
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
        ? article?.articleGoodsIssueNoteEntryTaxes?.map((entry) => {
            return entry?.tax?.id;
          }) || []
        : []
      }));
    const goodsIssueNote: CreateGoodsIssueNoteDto = {
      activityType,
      date: goodsIssueNoteManager?.date?.toString(),
      dueDate: goodsIssueNoteManager?.dueDate?.toString(),
      object: goodsIssueNoteManager?.object,
      firmId: goodsIssueNoteManager?.firm?.id,
      interlocutorId: goodsIssueNoteManager?.interlocutor?.id,
      currencyId: goodsIssueNoteManager?.currency?.id,
      bankAccountId: canReadTreasury && !controlManager?.isBankAccountDetailsHidden
        ? goodsIssueNoteManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? goodsIssueNoteManager?.generalConditions
        : '',
      notes: goodsIssueNoteManager?.notes,
      articleGoodsIssueNoteEntries: articlesDto,
      discount: goodsIssueNoteManager?.discount,
      discount_type:
        goodsIssueNoteManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      goodsIssueNoteMetaData: {
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showInvoiceAddress: !controlManager?.isInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: canReadTreasury && !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden,
        showPrices,
        vehicleRegistration: goodsIssueNoteManager.vehicleRegistration,
        driverName: goodsIssueNoteManager.driverName
      }
    };
    const validation = api.goodsIssueNote.validate(goodsIssueNote);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete goodsIssueNote.generalConditions;
      createGoodsIssueNote({
        goodsIssueNote,
        files: goodsIssueNoteManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
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

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={`${goodsIssueNoteManager.sequential || `goodsIssueNote-${goodsIssueNoteManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <GoodsIssueNoteSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <GoodsIssueNoteControlSection
          layout="dialog"
          showActions={false}
          showHeaderLabel={false}
          goodsIssueNotePathPrefix={'/selling/goods-issue-note'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          handleSubmitDraft={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Draft)}
          handleSubmitCreated={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Created)}
          handleSubmitIssued={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Issued)}
          reset={globalReset}
          loading={isCreatePending}
        />
      </GoodsIssueNoteSettingsDialog>
      <DocumentEditorShell
        disabled={isCreatePending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() =>
              router.push(firmId ? `/contacts/firm/${firmId}/?tab=goodsIssueNotes` : listPath)
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
              disabled={!goodsIssueNoteManager.id || goodsIssueNoteManager.id < 1}
              onClick={openPreviewDialog}
            >
              <Eye className="h-4 w-4" />
              {tCommon('commands.preview')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSettingsDialogOpen(true)}>
              <Settings2 className="h-4 w-4" />
              {tCommon('commands.settings')}
            </Button>
            <GoodsIssueNoteControlSection
              layout="floating"
              showHeaderLabel={false}
              showConfiguration={false}
              showVisibility={false}
              goodsIssueNotePathPrefix={'/selling/goods-issue-note'}
              listPath={listPath}
              bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
              currencies={currencies}
              handleSubmitDraft={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Draft)}
              handleSubmitCreated={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Created)}
              handleSubmitIssued={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Issued)}
              reset={globalReset}
              loading={isCreatePending}
            />
          </>
        }
      >
        <GoodsIssueNoteGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          loading={isCreatePending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <GoodsIssueNoteArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
            showPrices={showPrices}
           canUseProductChoices={canUseProductChoices} canReadTaxes={canReadTaxes} requiredReady={requiredReady}/>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <TransportCustomFields
            translationKey="goodsIssueNote"
            vehicleRegistration={goodsIssueNoteManager.vehicleRegistration}
            driverName={goodsIssueNoteManager.driverName}
            onVehicleRegistrationChange={(value) =>
              goodsIssueNoteManager.set('vehicleRegistration', value)
            }
            onDriverNameChange={(value) => goodsIssueNoteManager.set('driverName', value)}
          />
        </div>

        {showPrices && (
          <div className="flex justify-end border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <div className="w-full max-w-md">
              <CardTitle className="mb-4 text-base">
                {tInvoicing('goodsIssueNote.attributes.total')}
              </CardTitle>
              <GoodsIssueNoteFinancialInformation
                subTotal={goodsIssueNoteManager.subTotal}
                total={goodsIssueNoteManager.total}
                currency={goodsIssueNoteManager.currency}
              />
            </div>
          </div>
        )}

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('goodsIssueNote.attributes.notes')}
            </CardTitle>
            <GoodsIssueNoteExtraOptions loading={isCreatePending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('goodsIssueNote.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <GoodsIssueNoteGeneralConditions
              isPending={isCreatePending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <GoodsIssueNoteExtraOptions mode="files" />
        </div>
      </DocumentEditorShell>
    </div>
  );
};

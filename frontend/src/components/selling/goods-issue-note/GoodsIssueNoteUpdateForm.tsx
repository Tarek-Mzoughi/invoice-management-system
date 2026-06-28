import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleGoodsIssueNoteEntry,
  GOODS_ISSUE_NOTE_STATUS,
  GoodsIssueNote,
  GoodsIssueNoteUploadedFile,
  UpdateGoodsIssueNoteDto
} from '@/types';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useGoodsIssueNoteManager } from './hooks/useGoodsIssueNoteManager';
import { useGoodsIssueNoteArticleManager } from './hooks/useGoodsIssueNoteArticleManager';
import { useGoodsIssueNoteControlManager } from './hooks/useGoodsIssueNoteControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { GoodsIssueNoteExtraOptions } from './form/GoodsIssueNoteExtraOptions';
import { GoodsIssueNoteGeneralConditions } from './form/GoodsIssueNoteGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import { GoodsIssueNoteGeneralInformation } from './form/GoodsIssueNoteGeneralInformation';
import { GoodsIssueNoteArticleManagement } from './form/GoodsIssueNoteArticleManagement';
import { GoodsIssueNoteFinancialInformation } from './form/GoodsIssueNoteFinancialInformation';
import { GoodsIssueNoteControlSection } from './form/GoodsIssueNoteControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { GoodsIssueNoteSettingsDialog } from './dialogs/GoodsIssueNoteSettingsDialog';
import { GoodsIssueNoteActionDialog } from './dialogs/GoodsIssueNoteActionDialog';
import { GoodsIssueNoteDeleteDialog } from './dialogs/GoodsIssueNoteDeleteDialog';
import { GoodsIssueNoteDuplicateDialog } from './dialogs/GoodsIssueNoteDuplicateDialog';
import { useIntro } from '@/context/IntroContext';
import { Check, ChevronDown, Download, Eye, FileText, Settings2 } from 'lucide-react';
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
import { GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS } from '@/constants/goods-issue-note.lifecycle';
import { fromSequentialObjectToString } from '@/utils/string.utils';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface GoodsIssueNoteFormProps {
  className?: string;
  goodsIssueNoteId: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const GoodsIssueNoteUpdateForm = ({
  className,
  goodsIssueNoteId,
  scope = 'selling',
  listPath = '/selling/goods-issue-notes'
}: GoodsIssueNoteFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  // Stores
  const goodsIssueNoteManager = useGoodsIssueNoteManager();
  const controlManager = useGoodsIssueNoteControlManager();
  const articleManager = useGoodsIssueNoteArticleManager();
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
  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [actionLabel, setActionLabel] = React.useState('');
  const [actionCallback, setActionCallback] = React.useState<() => void>(() => {});
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const showPrices = !controlManager.isPricesHidden;
  //Fetch options
  const {
    isPending: isFetchPending,
    data: goodsIssueNoteResp,
    refetch: refetchGoodsIssueNote
  } = useQuery({
    queryKey: ['goodsIssueNote', goodsIssueNoteId],
    queryFn: () => api.goodsIssueNote.findOne(parseInt(goodsIssueNoteId)),
    enabled: requiredReady
  });
  const goodsIssueNote = React.useMemo(() => {
    return goodsIssueNoteResp || null;
  }, [goodsIssueNoteResp]);
  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    setIntro?.(
      goodsIssueNote?.sequential
        ? `${tInvoicing('goodsIssueNote.singular')} N° ${goodsIssueNote?.sequential}`
        : tInvoicing('goodsIssueNote.singular'),
      ''
    );
    if (goodsIssueNote?.sequential)
      setRoutes?.([
        {
          title: tCommon('menu.selling'),
          href: '/selling'
        },
        { title: tInvoicing('goodsIssueNote.plural'), href: listPath },
        { title: tInvoicing('goodsIssueNote.singular') + ' N° ' + goodsIssueNote?.sequential }
      ]);
    return () => {
      clearIntro?.();
    };
  }, [router.locale, goodsIssueNote?.sequential, listPath, scope]);
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
  //recognize if the form can be edited
  const editMode = React.useMemo(() => {
    const editModeStatuses = [GOODS_ISSUE_NOTE_STATUS.Created, GOODS_ISSUE_NOTE_STATUS.Draft];
    return goodsIssueNote?.status && editModeStatuses.includes(goodsIssueNote?.status);
  }, [goodsIssueNote]);
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
      goodsIssueNoteManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.GOODS_ISSUE_NOTE, {
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
    return goodsIssueNoteManager.currency?.digitAfterComma || 3;
  }, [goodsIssueNoteManager.currency]);
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
    goodsIssueNoteManager.set('subTotal', subTotal.toUnit());
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
  //full goodsIssueNote setter across multiple stores
  const setGoodsIssueNoteData = (
    data: Partial<
      GoodsIssueNote & {
        files: GoodsIssueNoteUploadedFile[];
      }
    >
  ) => {
    //goodsIssueNote infos
    data && goodsIssueNoteManager.setGoodsIssueNote(data, firms, bankAccounts);
    if (!canReadTreasury) goodsIssueNoteManager.set('bankAccount', null);
    //goodsIssueNote meta infos
    controlManager.setControls({
      isBankAccountDetailsHidden: !canReadTreasury || !data?.goodsIssueNoteMetaData?.hasBankingDetails,
      isInvoiceAddressHidden: !data?.goodsIssueNoteMetaData?.showInvoiceAddress,
      isDeliveryAddressHidden: !data?.goodsIssueNoteMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.goodsIssueNoteMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.goodsIssueNoteMetaData?.hasGeneralConditions,
      isPricesHidden: data?.goodsIssueNoteMetaData?.showPrices === false
    });
    //goodsIssueNote article infos
    articleManager.setArticles(data?.articleGoodsIssueNoteEntries || []);
  };
  //initialized value to detect changement whiie modifying the goodsIssueNote
  const { isDisabled, globalReset, isDataLoaded } = useInitializedState({
    data:
      goodsIssueNote ||
      ({} as Partial<
        GoodsIssueNote & {
          files: GoodsIssueNoteUploadedFile[];
        }
      >),
    getCurrentData: () => {
      return {
        goodsIssueNote: goodsIssueNoteManager.getGoodsIssueNote(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (
      data: Partial<
        GoodsIssueNote & {
          files: GoodsIssueNoteUploadedFile[];
        }
      >
    ) => {
      setGoodsIssueNoteData(data);
    },
    resetData: () => {
      goodsIssueNoteManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: initialLoading
  });
  const persistedShowPrices = goodsIssueNote?.goodsIssueNoteMetaData?.showPrices !== false;
  const resolvedShowPrices = isDataLoaded ? showPrices : persistedShowPrices;
  //update goodsIssueNote mutator
  const { mutate: updateGoodsIssueNote, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { goodsIssueNote: UpdateGoodsIssueNoteDto; files: File[] }) =>
      api.goodsIssueNote.update(data.goodsIssueNote, data.files),
    onSuccess: () => {
      toast.success(tInvoicing('goodsIssueNote.action_update_success'));
      refetchGoodsIssueNote();
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('goodsIssueNote.action_update_failure')
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
  const { mutate: downloadGoodsIssueNote, isPending: isDownloadPending } = useMutation({
    mutationFn: (id: number) => api.goodsIssueNote.download(id, 'template1'),
    onSuccess: () => {
      toast.success(tInvoicing('goodsIssueNote.action_download_success'));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('goodsIssueNote.action_download_failure'))
      );
    }
  });
  const { mutate: duplicateGoodsIssueNote, isPending: isDuplicationPending } = useMutation({
    mutationFn: (includeFiles: boolean) =>
      api.goodsIssueNote.duplicate({ id: goodsIssueNoteManager.id || 0, includeFiles }),
    onSuccess: async (data) => {
      toast.success(tInvoicing('goodsIssueNote.action_duplicate_success'));
      await router.push(`${'/selling/goods-issue-note'}/${data.id}`);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('goodsIssueNote.action_duplicate_failure'))
      );
    }
  });
  const { mutate: removeGoodsIssueNote, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.goodsIssueNote.remove(id),
    onSuccess: () => {
      toast.success(tInvoicing('goodsIssueNote.action_remove_success'));
      router.push(listPath);
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tInvoicing('goodsIssueNote.action_remove_failure')));
    }
  });
  //update handler
  const onSubmit = (status: GOODS_ISSUE_NOTE_STATUS) => {
    const articlesDto: ArticleGoodsIssueNoteEntry[] = articleManager
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
        taxes: canReadTaxes ? article?.articleGoodsIssueNoteEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
      }));
    const goodsIssueNote: UpdateGoodsIssueNoteDto = {
      id: goodsIssueNoteManager?.id,
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
      },
      uploads: goodsIssueNoteManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.goodsIssueNote.validate(goodsIssueNote);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateGoodsIssueNote({
        goodsIssueNote,
        files: goodsIssueNoteManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };
  const openActionConfirmation = React.useCallback((label: string, callback: () => void) => {
    setActionLabel(label);
    setActionCallback(() => callback);
    setActionDialogOpen(true);
  }, []);
  const isLifecycleActionVisible = React.useCallback(
    (actionKey: keyof typeof GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS) => {
      const lifecycle = GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS[actionKey];
      const matchesCurrentStatus = lifecycle.when.set.includes(goodsIssueNoteManager.status);
      return lifecycle.when.membership === 'IN' ? matchesCurrentStatus : !matchesCurrentStatus;
    },
    [goodsIssueNoteManager.status]
  );
  const isDraftGoodsIssueNote = goodsIssueNoteManager.status === GOODS_ISSUE_NOTE_STATUS.Draft;
  const updateTargetStatus = goodsIssueNoteManager.status || GOODS_ISSUE_NOTE_STATUS.Draft;
  const sequential = fromSequentialObjectToString(goodsIssueNoteManager.sequentialNumber);
  const draftActions: DocumentEditorActionModel[] = [
    {
      id: 'draft',
      label: tCommon('commands.draft'),
      icon: FileText,
      disabled: !editMode || isUpdatingPending,
      onClick: () => onSubmit(GOODS_ISSUE_NOTE_STATUS.Draft)
    },
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !goodsIssueNoteManager.id || goodsIssueNoteManager.id < 1 || isUpdatingPending,
      onClick: openPreviewDialog
    },
    {
      id: 'settings',
      label: tCommon('commands.settings'),
      icon: Settings2,
      disabled: isUpdatingPending,
      onClick: () => setSettingsDialogOpen(true)
    },
    {
      id: 'created',
      label: tCommon('commands.create'),
      icon: Check,
      variant: 'default',
      disabled: !editMode || isUpdatingPending,
      loading: isUpdatingPending,
      onClick: () => onSubmit(GOODS_ISSUE_NOTE_STATUS.Created)
    },
    {
      id: 'issued',
      label: tInvoicing('goodsIssueNote.status.issued'),
      icon: Check,
      variant: 'default',
      disabled: !editMode || isUpdatingPending,
      loading: isUpdatingPending,
      onClick: () => onSubmit(GOODS_ISSUE_NOTE_STATUS.Issued)
    }
  ];
  const standardActions: DocumentEditorActionModel[] = [
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !goodsIssueNoteManager.id || goodsIssueNoteManager.id < 1 || isUpdatingPending,
      onClick: openPreviewDialog
    },
    {
      id: 'settings',
      label: tCommon('commands.settings'),
      icon: Settings2,
      disabled: isUpdatingPending,
      onClick: () => setSettingsDialogOpen(true)
    }
  ];
  const lifecycleMenuActions = [
    {
      key: 'issued',
      icon: GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS.issued.icon,
      label: tInvoicing(GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS.issued.label),
      visible: isLifecycleActionVisible('issued'),
      disabled: !editMode || isUpdatingPending,
      onClick: () =>
        openActionConfirmation(tInvoicing('goodsIssueNote.status.issued'), () =>
          onSubmit(GOODS_ISSUE_NOTE_STATUS.Issued)
        )
    },
    {
      key: 'cancelled',
      icon: GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS.cancelled.icon,
      label: tCommon(GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS.cancelled.label),
      visible: isLifecycleActionVisible('cancelled'),
      disabled: !editMode || isUpdatingPending,
      onClick: () =>
        openActionConfirmation(tCommon('commands.cancel'), () =>
          onSubmit(GOODS_ISSUE_NOTE_STATUS.Cancelled)
        )
    },
    {
      key: 'duplicate',
      icon: GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS.duplicate.icon,
      label: tCommon(GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS.duplicate.label),
      visible: isLifecycleActionVisible('duplicate'),
      disabled: !goodsIssueNoteManager.id || isDuplicationPending,
      onClick: () => setDuplicateDialog(true)
    },
    {
      key: 'delete',
      icon: GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS.delete.icon,
      label: tCommon(GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS.delete.label),
      visible: isLifecycleActionVisible('delete'),
      disabled: !goodsIssueNoteManager.id || isDeletePending,
      onClick: () => setDeleteDialog(true)
    }
  ].filter((action) => action.visible);
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

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <GoodsIssueNoteActionDialog
        id={goodsIssueNoteManager.id}
        sequential={sequential}
        action={actionLabel}
        open={actionDialogOpen}
        callback={actionCallback}
        isCallbackPending={isUpdatingPending}
        onClose={() => setActionDialogOpen(false)}
      />
      <GoodsIssueNoteDuplicateDialog
        id={goodsIssueNoteManager.id || 0}
        sequential={sequential}
        open={duplicateDialog}
        duplicateGoodsIssueNote={(includeFiles: boolean) => {
          duplicateGoodsIssueNote(includeFiles);
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />
      <GoodsIssueNoteDeleteDialog
        id={goodsIssueNoteManager.id}
        sequential={sequential}
        open={deleteDialog}
        deleteGoodsIssueNote={() => {
          goodsIssueNoteManager.id && removeGoodsIssueNote(goodsIssueNoteManager.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
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
          status={goodsIssueNoteManager.status}
          isDataAltered={isDisabled}
          showActions={false}
          showHeaderLabel={false}
          goodsIssueNotePathPrefix={'/selling/goods-issue-note'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          handleSubmit={() => onSubmit(goodsIssueNoteManager.status)}
          handleSubmitDraft={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Draft)}
          handleSubmitCreated={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Created)}
          handleSubmitIssued={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Issued)}
          handleSubmitCancelled={() => onSubmit(GOODS_ISSUE_NOTE_STATUS.Cancelled)}
          loading={isUpdatingPending}
          reset={globalReset}
          edit={editMode}
        />
      </GoodsIssueNoteSettingsDialog>
      <DocumentEditorShell
        disabled={isUpdatingPending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() => router.push(listPath)}
            backLabel={tCommon('commands.back')}
            badge={
              <DocumentStatusBadge
                label={
                  goodsIssueNoteManager.status
                    ? tInvoicing(goodsIssueNoteManager.status)
                    : tCommon('commands.draft')
                }
                tone={
                  goodsIssueNoteManager.status === GOODS_ISSUE_NOTE_STATUS.Draft
                    ? 'draft'
                    : 'neutral'
                }
              />
            }
          />
        }
        toolbarActions={
          isDraftGoodsIssueNote ? (
            <DocumentEditorActionGroup actions={draftActions} />
          ) : (
            <>
              <DocumentEditorActionGroup actions={standardActions} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {tCommon('commands.actions')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem
                    className="gap-2"
                    disabled={!goodsIssueNoteManager.id || isDownloadPending}
                    onClick={() => {
                      goodsIssueNoteManager.id && downloadGoodsIssueNote(goodsIssueNoteManager.id);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    {tInvoicing('goodsIssueNote.details.download_pdf')}
                  </DropdownMenuItem>
                  {lifecycleMenuActions.length > 0 ? <DropdownMenuSeparator /> : null}
                  {lifecycleMenuActions.map((action) => (
                    <DropdownMenuItem
                      key={action.key}
                      className="gap-2"
                      disabled={action.disabled}
                      onClick={action.onClick}
                    >
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                disabled={!editMode || isDisabled || isUpdatingPending}
                onClick={() => onSubmit(updateTargetStatus)}
              >
                {tCommon('commands.update')}
                <Spinner show={isUpdatingPending} />
              </Button>
            </>
          )
        }
      >
        <GoodsIssueNoteGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          edit={editMode}
          loading={isUpdatingPending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <GoodsIssueNoteArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            edit={editMode}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
            showPrices={resolvedShowPrices}
            loading={isUpdatingPending}
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
            disabled={!editMode}
          />
        </div>

        {resolvedShowPrices && (
          <div className="flex justify-end border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <div className="w-full max-w-md">
              <CardTitle className="mb-4 text-base">
                {tInvoicing('goodsIssueNote.attributes.total')}
              </CardTitle>
              <GoodsIssueNoteFinancialInformation
                subTotal={goodsIssueNoteManager.subTotal}
                total={goodsIssueNoteManager.total}
                currency={goodsIssueNoteManager.currency}
                loading={isUpdatingPending}
                edit={editMode}
              />
            </div>
          </div>
        )}

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('goodsIssueNote.attributes.notes')}
            </CardTitle>
            <GoodsIssueNoteExtraOptions loading={isUpdatingPending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('goodsIssueNote.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <GoodsIssueNoteGeneralConditions
              isPending={isUpdatingPending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
              edit={editMode}
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

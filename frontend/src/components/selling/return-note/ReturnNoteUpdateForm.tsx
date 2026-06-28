import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  ArticleReturnNoteEntry,
  RETURN_NOTE_STATUS,
  ReturnNote,
  ReturnNoteUploadedFile,
  UpdateReturnNoteDto
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
import { useReturnNoteManager } from './hooks/useReturnNoteManager';
import { useReturnNoteArticleManager } from './hooks/useReturnNoteArticleManager';
import { useReturnNoteControlManager } from './hooks/useReturnNoteControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { ReturnNoteExtraOptions } from './form/ReturnNoteExtraOptions';
import { ReturnNoteGeneralConditions } from './form/ReturnNoteGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import { ReturnNoteGeneralInformation } from './form/ReturnNoteGeneralInformation';
import { ReturnNoteArticleManagement } from './form/ReturnNoteArticleManagement';
import { ReturnNoteFinancialInformation } from './form/ReturnNoteFinancialInformation';
import { ReturnNoteControlSection } from './form/ReturnNoteControlSection';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { ReturnNoteSettingsDialog } from './dialogs/ReturnNoteSettingsDialog';
import { ReturnNoteActionDialog } from './dialogs/ReturnNoteActionDialog';
import { ReturnNoteDeleteDialog } from './dialogs/ReturnNoteDeleteDialog';
import { ReturnNoteDuplicateDialog } from './dialogs/ReturnNoteDuplicateDialog';
import { ReturnNoteEmailDialog } from './dialogs/ReturnNoteEmailDialog';
import { ReturnNoteInvoiceDialog } from './dialogs/ReturnNoteInvoiceDialog';
import { ReturnNoteWhatsAppDialog } from './dialogs/ReturnNoteWhatsAppDialog';
import { useIntro } from '@/context/IntroContext';
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  Settings2
} from 'lucide-react';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import {
  DocumentEditorLead,
  DocumentEditorActionGroup,
  DocumentEditorShell,
  type DocumentEditorActionModel,
  useInitialEditorLoading
} from '@/features/invoicing/shared/editor';
import { DocumentStatusBadge } from '@/features/invoicing/shared/status';
import { RETURN_NOTE_LIFECYCLE_ACTIONS } from '@/constants/return-note.lifecycle';
import { fromSequentialObjectToString } from '@/utils/string.utils';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface ReturnNoteFormProps {
  className?: string;
  returnNoteId: string;
  scope?: 'selling' | 'buying';
  listPath?: string;
}
export const ReturnNoteUpdateForm = ({
  className,
  returnNoteId,
  scope = 'selling',
  listPath = '/selling/return-notes'
}: ReturnNoteFormProps) => {
  //next-router
  const router = useRouter();
  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  // Stores
  const returnNoteManager = useReturnNoteManager();
  const controlManager = useReturnNoteControlManager();
  const articleManager = useReturnNoteArticleManager();
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
  const documentLabels = useScopedDocumentLabels('returnNote', scope);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [actionLabel, setActionLabel] = React.useState('');
  const [actionCallback, setActionCallback] = React.useState<() => void>(() => {});
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [invoiceDialog, setInvoiceDialog] = React.useState(false);
  const [emailDialog, setEmailDialog] = React.useState(false);
  const [whatsAppDialog, setWhatsAppDialog] = React.useState(false);
  const showPrices = !controlManager.isPricesHidden;
  //Fetch options
  const {
    isPending: isFetchPending,
    data: returnNoteResp,
    refetch: refetchReturnNote
  } = useQuery({
    queryKey: ['returnNote', returnNoteId],
    queryFn: () => api.returnNote.findOne(parseInt(returnNoteId)),
    enabled: requiredReady
  });
  const returnNote = React.useMemo(() => {
    return returnNoteResp || null;
  }, [returnNoteResp]);
  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  const { setIntro, clearIntro } = useIntro();
  React.useEffect(() => {
    const displayNumber = documentLabels.displayNumber(returnNote);
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
    documentLabels,
    listPath,
    returnNote,
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
    if (!returnNoteManager.id || returnNoteManager.id < 1) return;
    setPreviewBlob(null);
    setPreviewDialog(true);
    loadReturnNotePreview();
  };
  //recognize if the form can be edited
  const editMode = React.useMemo(() => {
    const editModeStatuses = [RETURN_NOTE_STATUS.Validated, RETURN_NOTE_STATUS.Draft];
    return returnNote?.status && editModeStatuses.includes(returnNote?.status);
  }, [returnNote]);
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
      returnNoteManager.set('bankAccount', null);
    }
  }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.RETURN_NOTE, {
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
    return returnNoteManager.currency?.digitAfterComma || 3;
  }, [returnNoteManager.currency]);
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
    returnNoteManager.set('subTotal', subTotal.toUnit());
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
  //full returnNote setter across multiple stores
  const setReturnNoteData = (
    data: Partial<
      ReturnNote & {
        files: ReturnNoteUploadedFile[];
      }
    >
  ) => {
    //returnNote infos
    data && returnNoteManager.setReturnNote(data, firms, bankAccounts);
    if (!canReadTreasury) returnNoteManager.set('bankAccount', null);
    //returnNote meta infos
    controlManager.setControls({
      isBankAccountDetailsHidden: !canReadTreasury || !data?.returnNoteMetaData?.hasBankingDetails,
      isInvoiceAddressHidden: !data?.returnNoteMetaData?.showInvoiceAddress,
      isDeliveryAddressHidden: !data?.returnNoteMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.returnNoteMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.returnNoteMetaData?.hasGeneralConditions,
      isPricesHidden: data?.returnNoteMetaData?.showPrices === false
    });
    //returnNote article infos
    articleManager.setArticles(data?.articleReturnNoteEntries || []);
  };
  //initialized value to detect changement whiie modifying the returnNote
  const { isDisabled, globalReset } = useInitializedState({
    data:
      returnNote ||
      ({} as Partial<
        ReturnNote & {
          files: ReturnNoteUploadedFile[];
        }
      >),
    getCurrentData: () => {
      return {
        returnNote: returnNoteManager.getReturnNote(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (
      data: Partial<
        ReturnNote & {
          files: ReturnNoteUploadedFile[];
        }
      >
    ) => {
      setReturnNoteData(data);
    },
    resetData: () => {
      returnNoteManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: initialLoading
  });
  //update returnNote mutator
  const { mutate: updateReturnNote, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { returnNote: UpdateReturnNoteDto; files: File[] }) =>
      api.returnNote.update(data.returnNote, data.files),
    onSuccess: (data) => {
      if (data.status == RETURN_NOTE_STATUS.Invoiced) {
        toast.success(tInvoicing('returnNote.action_invoice_success'));
        // router.push(`/selling/invoice/${data.invoiceId}`);
      } else {
        toast.success(tInvoicing('returnNote.action_update_success'));
      }
      refetchReturnNote();
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('returnNote.action_update_failure')
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
  const { mutate: downloadReturnNote, isPending: isDownloadPending } = useMutation({
    mutationFn: (id: number) => api.returnNote.download(id, 'template1'),
    onSuccess: () => {
      toast.success(tInvoicing('returnNote.action_download_success'));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('returnNote.action_download_failure'))
      );
    }
  });
  const { mutate: duplicateReturnNote, isPending: isDuplicationPending } = useMutation({
    mutationFn: (includeFiles: boolean) =>
      api.returnNote.duplicate({ id: returnNoteManager.id || 0, includeFiles }),
    onSuccess: async (data) => {
      toast.success(tInvoicing('returnNote.action_duplicate_success'));
      await router.push(`${'/selling/return-note'}/${data.id}`);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('returnNote.action_duplicate_failure'))
      );
    }
  });
  const { mutate: removeReturnNote, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.returnNote.remove(id),
    onSuccess: () => {
      toast.success(tInvoicing('returnNote.action_remove_success'));
      router.push(listPath);
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tInvoicing('returnNote.action_remove_failure')));
    }
  });
  const { mutate: invoiceReturnNote, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.returnNote.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success(tInvoicing('returnNote.action_invoice_success'));
      refetchReturnNote();
      const createdInvoice = data.invoices[data.invoices.length - 1];
      if (createdInvoice?.id) {
        router.push(`${'/selling/invoice'}/${createdInvoice.id}`);
      }
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('returnNote.action_invoice_failure'))
      );
    }
  });
  //update handler
  const onSubmit = (status: RETURN_NOTE_STATUS) => {
    const articlesDto: ArticleReturnNoteEntry[] = articleManager.getArticles()?.map((article) => ({
      article: {
        title: article?.article?.title,
        description: controlManager.isArticleDescriptionHidden ? '' : article?.article?.description
      },
      quantity: article?.quantity || 0,
      unit_price: article?.unit_price || 0,
      discount: article?.discount || 0,
      discount_type:
        article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      taxes: canReadTaxes ? article?.articleReturnNoteEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
    }));
    const returnNote: UpdateReturnNoteDto = {
      id: returnNoteManager?.id,
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
      },
      uploads: returnNoteManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.returnNote.validate(returnNote);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateReturnNote({
        returnNote,
        files: returnNoteManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };
  const openActionConfirmation = React.useCallback((label: string, callback: () => void) => {
    setActionLabel(label);
    setActionCallback(() => callback);
    setActionDialogOpen(true);
  }, []);
  const isLifecycleActionVisible = React.useCallback(
    (actionKey: keyof typeof RETURN_NOTE_LIFECYCLE_ACTIONS) => {
      const lifecycle = RETURN_NOTE_LIFECYCLE_ACTIONS[actionKey];
      const matchesCurrentStatus = lifecycle.when.set.includes(returnNoteManager.status);
      return lifecycle.when.membership === 'IN' ? matchesCurrentStatus : !matchesCurrentStatus;
    },
    [returnNoteManager.status]
  );
  const isDraftReturnNote = returnNoteManager.status === RETURN_NOTE_STATUS.Draft;
  const updateTargetStatus = returnNoteManager.status || RETURN_NOTE_STATUS.Draft;
  const sequential = fromSequentialObjectToString(returnNoteManager.sequentialNumber);
  const draftActions: DocumentEditorActionModel[] = [
    {
      id: 'draft',
      label: tCommon('commands.draft'),
      icon: FileText,
      disabled: !editMode || isUpdatingPending,
      onClick: () => onSubmit(RETURN_NOTE_STATUS.Draft)
    },
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !returnNoteManager.id || returnNoteManager.id < 1 || isUpdatingPending,
      onClick: openPreviewDialog
    },
    {
      id: 'settings',
      label: tCommon('commands.settings'),
      icon: Settings2,
      disabled: !editMode || isUpdatingPending,
      onClick: () => setSettingsDialogOpen(true)
    },
    {
      id: 'validate',
      label: tCommon('commands.validate'),
      icon: Check,
      variant: 'default',
      disabled: !editMode || isUpdatingPending,
      loading: isUpdatingPending,
      onClick: () => onSubmit(RETURN_NOTE_STATUS.Validated)
    }
  ];
  const standardActions: DocumentEditorActionModel[] = [
    {
      id: 'preview',
      label: tCommon('commands.preview'),
      icon: Eye,
      disabled: !returnNoteManager.id || returnNoteManager.id < 1 || isUpdatingPending,
      onClick: openPreviewDialog
    },
    {
      id: 'settings',
      label: tCommon('commands.settings'),
      icon: Settings2,
      disabled: !editMode || isUpdatingPending,
      onClick: () => setSettingsDialogOpen(true)
    }
  ];
  const lifecycleMenuActions = [
    {
      key: 'validated',
      icon: RETURN_NOTE_LIFECYCLE_ACTIONS.validated.icon,
      label: tCommon(RETURN_NOTE_LIFECYCLE_ACTIONS.validated.label),
      visible: isLifecycleActionVisible('validated'),
      disabled: !editMode || isUpdatingPending,
      onClick: () =>
        openActionConfirmation(tCommon('commands.validate'), () =>
          onSubmit(RETURN_NOTE_STATUS.Validated)
        )
    },
    {
      key: 'sent',
      icon: RETURN_NOTE_LIFECYCLE_ACTIONS.sent.icon,
      label: tCommon(RETURN_NOTE_LIFECYCLE_ACTIONS.sent.label),
      visible: isLifecycleActionVisible('sent'),
      disabled: !editMode || isUpdatingPending,
      onClick: () =>
        openActionConfirmation(tCommon('commands.send'), () => onSubmit(RETURN_NOTE_STATUS.Sent))
    },
    {
      key: 'accepted',
      icon: RETURN_NOTE_LIFECYCLE_ACTIONS.accepted.icon,
      label: tCommon(RETURN_NOTE_LIFECYCLE_ACTIONS.accepted.label),
      visible: isLifecycleActionVisible('accepted'),
      disabled: !editMode || isUpdatingPending,
      onClick: () =>
        openActionConfirmation(tCommon('commands.accept'), () =>
          onSubmit(RETURN_NOTE_STATUS.Accepted)
        )
    },
    {
      key: 'rejected',
      icon: RETURN_NOTE_LIFECYCLE_ACTIONS.rejected.icon,
      label: tCommon(RETURN_NOTE_LIFECYCLE_ACTIONS.rejected.label),
      visible: isLifecycleActionVisible('rejected'),
      disabled: !editMode || isUpdatingPending,
      onClick: () =>
        openActionConfirmation(tCommon('commands.reject'), () =>
          onSubmit(RETURN_NOTE_STATUS.Rejected)
        )
    },
    {
      key: 'invoiced',
      icon: RETURN_NOTE_LIFECYCLE_ACTIONS.invoiced.icon,
      label: tCommon(RETURN_NOTE_LIFECYCLE_ACTIONS.invoiced.label),
      visible: !isBuying && isLifecycleActionVisible('invoiced'),
      disabled: !returnNoteManager.id || isInvoicingPending,
      onClick: () => setInvoiceDialog(true)
    },
    {
      key: 'duplicate',
      icon: RETURN_NOTE_LIFECYCLE_ACTIONS.duplicate.icon,
      label: tCommon(RETURN_NOTE_LIFECYCLE_ACTIONS.duplicate.label),
      visible: isLifecycleActionVisible('duplicate'),
      disabled: !returnNoteManager.id || isDuplicationPending,
      onClick: () => setDuplicateDialog(true)
    },
    {
      key: 'delete',
      icon: RETURN_NOTE_LIFECYCLE_ACTIONS.delete.icon,
      label: tCommon(RETURN_NOTE_LIFECYCLE_ACTIONS.delete.label),
      visible: isLifecycleActionVisible('delete'),
      disabled: !returnNoteManager.id || isDeletePending,
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
      <ReturnNoteActionDialog
        id={returnNoteManager.id}
        sequential={sequential}
        action={actionLabel}
        open={actionDialogOpen}
        callback={actionCallback}
        isCallbackPending={isUpdatingPending}
        onClose={() => setActionDialogOpen(false)}
      />
      <ReturnNoteDuplicateDialog
        id={returnNoteManager.id || 0}
        sequential={sequential}
        scope={scope}
        open={duplicateDialog}
        duplicateReturnNote={(includeFiles: boolean) => {
          duplicateReturnNote(includeFiles);
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />
      <ReturnNoteDeleteDialog
        id={returnNoteManager.id}
        sequential={sequential}
        scope={scope}
        open={deleteDialog}
        deleteReturnNote={() => {
          returnNoteManager.id && removeReturnNote(returnNoteManager.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
      {!isBuying && (
        <ReturnNoteInvoiceDialog
          id={returnNoteManager.id}
          status={returnNoteManager.status}
          sequential={sequential}
          open={invoiceDialog}
          isInvoicePending={isInvoicingPending}
          invoice={(id: number, createInvoice: boolean) => {
            invoiceReturnNote({ id, createInvoice });
          }}
          onClose={() => setInvoiceDialog(false)}
        />
      )}
      <ReturnNoteEmailDialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        returnNote={returnNote}
        scope={scope}
      />
      <ReturnNoteWhatsAppDialog
        open={whatsAppDialog}
        onClose={() => setWhatsAppDialog(false)}
        returnNote={returnNote}
        scope={scope}
      />
      <DocumentPreviewDialog
        open={previewDialog}
        loading={isPreviewPending}
        previewBlob={previewBlob}
        filename={`${returnNoteManager.sequential || `returnNote-${returnNoteManager.id || 'preview'}`}.pdf`}
        title={tCommon('commands.preview')}
        onClose={closePreviewDialog}
      />
      <ReturnNoteSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <ReturnNoteControlSection
          layout="dialog"
          status={returnNoteManager.status}
          isDataAltered={isDisabled}
          showActions={false}
          showHeaderLabel={false}
          showInvoices={false}
          allowInvoiceAction={!isBuying}
          returnNotePathPrefix={'/selling/return-note'}
          detailPathPrefix={'/selling/invoice'}
          listPath={listPath}
          bankAccounts={bankAccounts} canReadTreasury={canReadTreasury}
          currencies={currencies}
          invoices={returnNote?.invoices || []}
          handleSubmit={() => onSubmit(returnNoteManager.status)}
          handleSubmitDraft={() => onSubmit(RETURN_NOTE_STATUS.Draft)}
          handleSubmitValidated={() => onSubmit(RETURN_NOTE_STATUS.Validated)}
          handleSubmitSent={() => onSubmit(RETURN_NOTE_STATUS.Sent)}
          handleSubmitAccepted={() => onSubmit(RETURN_NOTE_STATUS.Accepted)}
          handleSubmitRejected={() => onSubmit(RETURN_NOTE_STATUS.Rejected)}
          loading={isUpdatingPending}
          refetch={refetchReturnNote}
          reset={globalReset}
          edit={editMode}
        />
      </ReturnNoteSettingsDialog>
      <DocumentEditorShell
        disabled={isUpdatingPending}
        toolbarLeading={
          <DocumentEditorLead
            onBack={() => router.push(listPath)}
            backLabel={tCommon('commands.back')}
            badge={
              <DocumentStatusBadge
                label={
                  returnNoteManager.status
                    ? tInvoicing(returnNoteManager.status)
                    : tCommon('commands.draft')
                }
                tone={returnNoteManager.status === RETURN_NOTE_STATUS.Draft ? 'draft' : 'neutral'}
              />
            }
          />
        }
        toolbarActions={
          isDraftReturnNote ? (
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
                    disabled={!returnNoteManager.id || isDownloadPending}
                    onClick={() => {
                      returnNoteManager.id && downloadReturnNote(returnNoteManager.id);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    {tInvoicing('returnNote.details.download_pdf')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2"
                    disabled={!returnNote}
                    onClick={() => setEmailDialog(true)}
                  >
                    <Mail className="h-4 w-4" />
                    {tInvoicing('returnNote.details.send_email')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2"
                    disabled={!returnNote}
                    onClick={() => setWhatsAppDialog(true)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {tInvoicing('returnNote.details.send_whatsapp')}
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
        <ReturnNoteGeneralInformation
          firms={firms}
          isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
          isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
          edit={editMode}
          loading={isUpdatingPending}
        />

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <ReturnNoteArticleManagement
            embedded
            taxes={canReadTaxes ? taxes : []}
            edit={editMode}
            isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
            showPrices={showPrices}
            loading={isUpdatingPending}
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
                loading={isUpdatingPending}
                edit={editMode}
              />
            </div>
          </div>
        )}

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">{tInvoicing('returnNote.attributes.notes')}</CardTitle>
            <ReturnNoteExtraOptions loading={isUpdatingPending} mode="notes" />
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {tInvoicing('returnNote.attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <ReturnNoteGeneralConditions
              isPending={isUpdatingPending}
              hidden={controlManager.isGeneralConditionsHidden}
              defaultCondition={defaultCondition}
              edit={editMode}
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

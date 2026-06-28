import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import { ArticleInvoiceEntry, CreateInvoiceDto, INVOICE_STATUS, QUOTATION_STATUS } from '@/types';
import { Spinner } from '@/components/shared';
import { CardTitle } from '@/components/ui/card';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useInvoiceManager } from '@/components/selling/invoice/hooks/useInvoiceManager';
import { useInvoiceArticleManager } from './hooks/useInvoiceArticleManager';
import useInvoiceSocket from './hooks/useInvoiceSocket';
import { useInvoiceControlManager } from './hooks/useInvoiceControlManager';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import useCabinet from '@/hooks/content/useCabinet';
import { InvoiceExtraOptions } from './form/InvoiceExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { InvoiceGeneralConditions } from './form/InvoiceGeneralConditions';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useQuotationChoices from '@/hooks/content/useQuotationChoice';
import { InvoiceGeneralInformation } from './form/InvoiceGeneralInformation';
import { InvoiceArticleManagement } from './form/InvoiceArticleManagement';
import { InvoiceFinancialInformation } from './form/InvoiceFinancialInformation';
import { InvoiceControlSection } from './form/InvoiceControlSection';
import useTaxWithholding from '@/hooks/content/useTaxWithholding';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import useInvoiceRangeDates from '@/hooks/content/useInvoiceRangeDates';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';
import { InvoiceSettingsDialog } from './dialogs/InvoiceSettingsDialog';
import { Check, Eye, FileText, Settings2 } from 'lucide-react';
import { useIntro } from '@/context/IntroContext';
import { DocumentEditorActionGroup, DocumentEditorLead, DocumentEditorShell, useInitialEditorLoading } from '@/features/invoicing/shared/editor';
import { DocumentStatusBadge } from '@/features/invoicing/shared/status';
import {
  INVOICE_FORM_STATUS,
  type DocumentEditorActionModel
} from '@/features/invoicing/shared/models';
import { useDocumentResourcePermissions } from '@/features/rbac/useDocumentResourcePermissions';
import { DocumentRequiredPermissionNotices } from '@/features/rbac/DocumentRequiredPermissionNotices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
import { getDocumentFirmChoiceParams } from '@/features/rbac/documentFormResources';
interface InvoiceFormProps {
    className?: string;
    firmId?: string;
    scope?: 'selling' | 'buying';
    listPath?: string;
}
export const InvoiceCreateForm = ({ className, firmId, scope = 'selling', listPath = '/selling/invoices' }: InvoiceFormProps) => {
    const router = useRouter();
    const { t: tCommon, ready: commonReady } = useTranslation('common');
    const { ready: invoicingReady } = useTranslation('invoicing');
    const { t: tContacts } = useTranslation('contacts');
    const invoiceManager = useInvoiceManager();
    const articleManager = useInvoiceArticleManager();
    const controlManager = useInvoiceControlManager();
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
    const invoiceLabels = useSellingInvoiceLabels({ enabled: true, scope });
    const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
    const [previewDialog, setPreviewDialog] = React.useState(false);
    const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
    const { setRoutes } = useBreadcrumb();
    const { setIntro, clearIntro } = useIntro();
    React.useEffect(() => {
        setIntro?.(invoiceLabels.newLabel, '');
        setRoutes?.(!firmId
            ? [
                {
                    title: tCommon('menu.selling'),
                    href: '/selling'
                },
                { title: invoiceLabels.plural, href: listPath },
                { title: invoiceLabels.newLabel }
            ]
            : [
                { title: tCommon('menu.contacts'), href: '/contacts' },
                { title: tContacts('firm.plural'), href: '/contacts/firms' },
                {
                    title: `${tContacts('firm.singular')} N°${firmId}`,
                    href: `/contacts/firm/${firmId}?tab=entreprise`
                },
                { title: invoiceLabels.newLabel }
            ]);
        return () => {
            clearIntro?.();
        };
    }, [router.locale, firmId, listPath, scope, invoiceLabels.newLabel, invoiceLabels.plural]);
    const closePreviewDialog = () => {
        setPreviewDialog(false);
        setPreviewBlob(null);
    };
    const openPreviewDialog = () => {
        if (!invoiceManager.id || invoiceManager.id < 1)
            return;
        setPreviewBlob(null);
        setPreviewDialog(true);
        loadInvoicePreview();
    };
    const { firms, isFetchFirmsPending } = useFirmChoice({
    params: firmChoiceParams,
    entityType: isBuying ? 'suppliers' : 'clients',
    context: 'document',
    activityType,
    enabled: requiredReady && canUsePartnerChoices,
    silentForbiddenToast: true
  });
    const { quotations, isFetchQuotationPending } = useQuotationChoices(QUOTATION_STATUS.Invoiced, true, activityType);
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
        invoiceManager.set('bankAccount', null);
      }
    }, [canReadTreasury, controlManager.isBankAccountDetailsHidden, permissions.isPending]);
    const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(activityType, DOCUMENT_TYPE.INVOICE, {
    enabled: requiredReady && canReadDocumentSettings,
    silentForbiddenToast: true
  });
    const { taxWithholdings, isFetchTaxWithholdingsPending } = useTaxWithholding({
    enabled: requiredReady && canReadTaxes,
    silentForbiddenToast: true
  });
    const { dateRange, isFetchInvoiceRangePending } = useInvoiceRangeDates(invoiceManager.id);
    const { currentSequence, isSequencePending } = useInvoiceSocket(requiredReady && canReadDocumentSettings);
    React.useEffect(() => {
        invoiceManager.set('sequentialNumber', currentSequence);
        invoiceManager.set('bankAccount', bankAccounts.find((account) => account.isMain));
        invoiceManager.set('currency', cabinet?.currency);
    }, [currentSequence]);
    const digitAfterComma = React.useMemo(() => {
        return invoiceManager.currency?.digitAfterComma || 3;
    }, [invoiceManager.currency]);
    React.useEffect(() => {
        const zero = dinero({ amount: 0, precision: digitAfterComma });
        const articles = articleManager.getArticles() || [];
        const subTotal = articles.reduce((acc, article) => {
            return acc.add(dinero({
                amount: createDineroAmountFromFloatWithDynamicCurrency(article?.subTotal || 0, digitAfterComma),
                precision: digitAfterComma
            }));
        }, zero);
        invoiceManager.set('subTotal', subTotal.toUnit());
        const total = articles.reduce((acc, article) => acc.add(dinero({
            amount: createDineroAmountFromFloatWithDynamicCurrency(article?.total || 0, digitAfterComma),
            precision: digitAfterComma
        })), zero);
        let finalTotal = total;
        if (invoiceManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
            const discountAmount = total.multiply(invoiceManager.discount / 100);
            finalTotal = total.subtract(discountAmount);
        }
        else {
            const discountAmount = dinero({
                amount: createDineroAmountFromFloatWithDynamicCurrency(invoiceManager?.discount || 0, digitAfterComma),
                precision: digitAfterComma
            });
            finalTotal = total.subtract(discountAmount);
        }
        if (canReadTaxes && invoiceManager.taxStampId) {
            const tax = taxes.find((currentTax) => currentTax.id === invoiceManager.taxStampId);
            if (tax) {
                const taxAmount = dinero({
                    amount: createDineroAmountFromFloatWithDynamicCurrency(tax.value || 0, digitAfterComma),
                    precision: digitAfterComma
                });
                finalTotal = finalTotal.add(taxAmount);
            }
        }
        invoiceManager.set('total', finalTotal.toUnit());
    }, [
        articleManager.articles,
        digitAfterComma,
        invoiceManager.discount,
        invoiceManager.discountType,
        invoiceManager.taxStampId,
        canReadTaxes,
    taxes
    ]);
    const { mutate: createInvoice, isPending: isCreatePending } = useMutation({
        mutationFn: (data: {
            invoice: CreateInvoiceDto;
            files: File[];
        }) => api.invoice.create(data.invoice, data.files),
        onSuccess: () => {
            if (!firmId) {
                router.push(listPath);
            }
            else {
                router.push(`/contacts/firm/${firmId}/?tab=invoices`);
            }
            toast.success(invoiceLabels.t('action_create_success'));
            globalReset();
        },
        onError: (error) => {
            const message = getErrorMessage('invoicing', error, invoiceLabels.t('action_create_failure'));
            toast.error(message);
        }
    });
    const { mutate: loadInvoicePreview, isPending: isPreviewPending } = useMutation({
        mutationFn: () => api.invoice.preview(invoiceManager.id || 0, 'template1'),
        onSuccess: (blob) => {
            setPreviewBlob(blob);
        },
        onError: (error) => {
            toast.error(getErrorMessage('invoicing', error, invoiceLabels.t('action_preview_failure')));
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
        isFetchQuotationPending ||
        isFetchTaxWithholdingsPending ||
        isFetchInvoiceRangePending ||
        isSequencePending ||
        !commonReady ||
        !invoicingReady;
    const isInitialRenderPending = useInitialEditorLoading(initialLoading);
    const contactInvoicesPath = firmId ? `/contacts/firm/${firmId}/?tab=invoices` : listPath;
    const globalReset = () => {
        invoiceManager.reset();
        articleManager.reset();
        controlManager.reset();
        invoiceManager.set('activityType', activityType);
        invoiceManager.set('reference', '');
    };
    React.useEffect(() => {
        globalReset();
    }, []);
    const onSubmit = (status: INVOICE_STATUS) => {
        const articlesDto: ArticleInvoiceEntry[] = articleManager.getArticles()?.map((article) => ({
            id: article?.id,
            article: {
                title: article?.article?.title || '',
                description: !controlManager.isArticleDescriptionHidden
                    ? article?.article?.description || ''
                    : ''
            },
            quantity: article?.quantity || 0,
            unit_price: article?.unit_price || 0,
            discount: article?.discount || 0,
            discount_type: article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
            taxes: canReadTaxes ? article?.articleInvoiceEntryTaxes?.map((entry) => entry?.tax?.id) || [] : []
        }));
        const invoice: CreateInvoiceDto = {
            activityType,
            reference: isBuying ? invoiceManager.reference?.trim() : undefined,
            date: invoiceManager?.date?.toString(),
            dueDate: invoiceManager?.dueDate?.toString(),
            object: invoiceManager?.object,
            firmId: invoiceManager?.firm?.id,
            interlocutorId: invoiceManager?.interlocutor?.id,
            currencyId: invoiceManager?.currency?.id,
            bankAccountId: canReadTreasury && !controlManager?.isBankAccountDetailsHidden
                ? invoiceManager?.bankAccount?.id
                : undefined,
            status,
            generalConditions: !controlManager.isGeneralConditionsHidden
                ? invoiceManager?.generalConditions
                : '',
            notes: invoiceManager?.notes,
            articleInvoiceEntries: articlesDto,
            discount: invoiceManager?.discount,
            discount_type: invoiceManager?.discountType === 'PERCENTAGE'
                ? DISCOUNT_TYPE.PERCENTAGE
                : DISCOUNT_TYPE.AMOUNT,
            quotationId: invoiceManager?.quotationId,
            taxStampId: canReadTaxes ? invoiceManager?.taxStampId : undefined,
            taxWithholdingId: canReadTaxes ? invoiceManager?.taxWithholdingId : undefined,
            invoiceMetaData: {
                showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
                showInvoiceAddress: !controlManager?.isInvoiceAddressHidden,
                showArticleDescription: !controlManager?.isArticleDescriptionHidden,
                hasBankingDetails: canReadTreasury && !controlManager.isBankAccountDetailsHidden,
                hasGeneralConditions: !controlManager.isGeneralConditionsHidden,
                hasTaxWithholding: canReadTaxes && !controlManager.isTaxWithholdingHidden,
                hasTaxStamp: canReadTaxes && !controlManager.isTaxStampHidden
            }
        };
        const validation = api.invoice.validate(invoice, dateRange);
        if (validation.message) {
            toast.error(validation.message);
        }
        else {
            if (controlManager.isGeneralConditionsHidden)
                delete invoice.generalConditions;
            createInvoice({
                invoice,
                files: invoiceManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
            });
        }
    };
    if (isInitialRenderPending)
        return <Spinner className="h-screen" show={isInitialRenderPending}/>;


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
const sellingCreateActions: DocumentEditorActionModel[] = [
        {
            id: 'draft',
            label: tCommon('commands.draft'),
            icon: FileText,
            disabled: isCreatePending,
            onClick: () => onSubmit(INVOICE_FORM_STATUS.draft)
        },
        {
            id: 'preview',
            label: tCommon('commands.preview'),
            icon: Eye,
            disabled: !invoiceManager.id || invoiceManager.id < 1 || isCreatePending,
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
            onClick: () => onSubmit(INVOICE_FORM_STATUS.validated)
        }
    ];
    return (<div className={cn('flex-1 overflow-auto py-6', className)}>
      <DocumentPreviewDialog open={previewDialog} loading={isPreviewPending} previewBlob={previewBlob} filename={`${(isBuying ? invoiceManager.reference : undefined) ||
            invoiceManager.sequential ||
            `invoice-${invoiceManager.id || 'preview'}`}.pdf`} title={tCommon('commands.preview')} onClose={closePreviewDialog}/>

      <InvoiceSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <InvoiceControlSection layout="dialog" showActions={false} showHeaderLabel={false} showPayments={false} invoicePathPrefix={'/selling/invoice'} paymentPathPrefix={'/payments'} listPath={listPath} bankAccounts={bankAccounts} canReadTreasury={canReadTreasury} canReadTaxes={canReadTaxes} currencies={currencies} quotations={quotations} taxes={canReadTaxes ? taxes : []} taxWithholdings={canReadTaxes ? taxWithholdings : []} payments={[]} handleSubmitDraft={() => onSubmit(INVOICE_FORM_STATUS.draft)} handleSubmitValidated={() => onSubmit(INVOICE_FORM_STATUS.validated)} handleSubmitSent={() => onSubmit(INVOICE_FORM_STATUS.validated)} reset={globalReset} loading={isCreatePending}/>
      </InvoiceSettingsDialog>

      <DocumentEditorShell disabled={isCreatePending} toolbarLeading={<DocumentEditorLead onBack={() => router.push(contactInvoicesPath)} backLabel={tCommon('commands.back')} badge={<DocumentStatusBadge label={tCommon('commands.draft')} tone="draft"/>}/>} toolbarActions={(<DocumentEditorActionGroup actions={sellingCreateActions}/>)}>
        <InvoiceGeneralInformation activityType={activityType} firms={firms} isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden} isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden} loading={isCreatePending}/>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <InvoiceArticleManagement embedded taxes={canReadTaxes ? taxes : []} isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden} loading={isCreatePending} canUseProductChoices={canUseProductChoices} canReadTaxes={canReadTaxes} requiredReady={requiredReady}/>
        </div>

        <div className="flex justify-end border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <div className="w-full max-w-md">
            <CardTitle className="mb-4 text-base">{invoiceLabels.t('attributes.total')}</CardTitle>
            <InvoiceFinancialInformation subTotal={invoiceManager.subTotal} status={INVOICE_STATUS.Nonexistent} currency={invoiceManager.currency} taxes={canReadTaxes ? taxes.filter((tax) => !tax.isRate) : []} taxWithholdings={canReadTaxes ? taxWithholdings : []}/>
          </div>
        </div>

        <div className="grid gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800 xl:grid-cols-2">
          <div className="space-y-3">
            <CardTitle className="text-base">{invoiceLabels.t('attributes.notes')}</CardTitle>
            <InvoiceExtraOptions loading={isCreatePending} mode="notes"/>
          </div>

          <div className="space-y-3">
            <CardTitle className="text-base">
              {invoiceLabels.t('attributes.general_condition')}
            </CardTitle>
            {!canReadDocumentSettings && (
              <PermissionNotice tone="info" i18nKey="rbac.documentSettingsUnavailable" compact />
            )}
            <InvoiceGeneralConditions isPending={isCreatePending} hidden={controlManager.isGeneralConditionsHidden} defaultCondition={defaultCondition}/>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <InvoiceExtraOptions mode="files"/>
        </div>
      </DocumentEditorShell>
    </div>);
};

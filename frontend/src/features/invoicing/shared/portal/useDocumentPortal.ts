import React from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { enUS, fr } from 'date-fns/locale';
import { api } from '@/api';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { getErrorMessage } from '@/utils/errors';
import { ACTIVITY_TYPE } from '@/types';
import { useGuardedRouter } from '@/features/rbac/useGuardedNavigation';

export interface DocumentFilters {
  clientId: string;
  status: string;
  startDate: string;
  endDate: string;
  minTotal: string;
  maxTotal: string;
}

export const INITIAL_FILTERS: DocumentFilters = {
  clientId: 'all',
  status: 'all',
  startDate: '',
  endDate: '',
  minTotal: '',
  maxTotal: ''
};

export interface DocumentPortalApi<TEntity> {
  findPaginated: (
    page: number,
    size: number,
    order: 'ASC' | 'DESC',
    sortKey: string,
    options: Record<string, any>
  ) => Promise<{ data: TEntity[]; meta: { pageCount: number; itemCount: number } }>;
  remove: (id: number) => Promise<TEntity>;
  duplicate: (dto: any) => Promise<TEntity>;
  download: (id: number, template: string) => Promise<Blob>;
  preview?: (id: number, template: string) => Promise<Blob>;
}

export interface UseDocumentPortalConfig<TEntity> {
  entityKey: string;
  translationKey: string;
  apiModule: DocumentPortalApi<TEntity>;
  scope: 'selling' | 'buying';
  rootPath: string;
  listPath: string;
  newPath: string;
  detailPathPrefix: string;
  defaultRelations?: string[];
  firmId?: number;
  interlocutorId?: number;
}

export function useDocumentPortal<
  TEntity extends { id?: number; sequential?: string; status?: string }
>({
  entityKey,
  translationKey,
  apiModule,
  scope,
  rootPath,
  listPath,
  newPath,
  detailPathPrefix,
  defaultRelations = ['firm', 'interlocutor', 'currency'],
  firmId,
  interlocutorId
}: UseDocumentPortalConfig<TEntity>) {
  const router = useGuardedRouter();
  const { t: tCommon, ready: commonReady, i18n } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { setRoutes, clearRoutes } = useBreadcrumb();
  const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();

  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const numberLocale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const activityType = scope === 'buying' ? ACTIVITY_TYPE.BUYING : ACTIVITY_TYPE.SELLING;

  const partnerLabel =
    activityType === ACTIVITY_TYPE.BUYING
      ? tInvoicing(`${translationKey}.attributes.supplier`)
      : tInvoicing(`${translationKey}.attributes.customer`);
  const partnerPlaceholder =
    activityType === ACTIVITY_TYPE.BUYING
      ? tCommon('filters.select_supplier')
      : tCommon('filters.select_customer');
  const allPartnersLabel =
    activityType === ACTIVITY_TYPE.BUYING
      ? tCommon('filters.all_suppliers')
      : tCommon('filters.all_customers');

  // --- State ---
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(20);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filters, setFilters] = React.useState<DocumentFilters>({
    ...INITIAL_FILTERS,
    clientId: firmId ? String(firmId) : INITIAL_FILTERS.clientId
  });
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  // --- Dialog states ---
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);

  const { value: debouncedSearchTerm, loading: searching } = useDebounce(searchTerm, 400);
  const { value: debouncedFilters, loading: filtering } = useDebounce(filters, 400);

  // --- Queries ---
  const {
    isPending: isFetchPending,
    error,
    data: listResp,
    refetch: refetchList
  } = useQuery({
    queryKey: [
      entityKey,
      page,
      size,
      debouncedSearchTerm,
      debouncedFilters.clientId,
      debouncedFilters.status,
      debouncedFilters.startDate,
      debouncedFilters.endDate,
      debouncedFilters.minTotal,
      debouncedFilters.maxTotal,
      activityType,
      firmId,
      interlocutorId
    ],
    queryFn: () =>
      apiModule.findPaginated(page, size, 'DESC', 'createdAt', {
        search: debouncedSearchTerm,
        activityType,
        relations: defaultRelations,
        firmId:
          firmId ||
          (debouncedFilters.clientId === 'all' ? undefined : Number(debouncedFilters.clientId)),
        interlocutorId,
        status: debouncedFilters.status === 'all' ? undefined : debouncedFilters.status,
        startDate: debouncedFilters.startDate || undefined,
        endDate: debouncedFilters.endDate || undefined,
        minTotal: debouncedFilters.minTotal === '' ? undefined : Number(debouncedFilters.minTotal),
        maxTotal: debouncedFilters.maxTotal === '' ? undefined : Number(debouncedFilters.maxTotal)
      })
  });

  const { data: firms = [], isPending: isFetchFirmsPending } = useQuery({
    queryKey: [`${entityKey}-firm-choices`, activityType],
    queryFn: () =>
      api.firm.findChoices([], activityType === ACTIVITY_TYPE.BUYING ? 'suppliers' : 'clients'),
    staleTime: 60_000,
    enabled: !firmId
  });

  const items = React.useMemo(() => listResp?.data || [], [listResp]);
  const totalPageCount = listResp?.meta.pageCount || 0;
  const totalResultCount = listResp?.meta.itemCount || 0;

  // --- Effects ---
  React.useEffect(() => {
    setSelectedIds((current) => current.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  React.useEffect(() => {
    if (totalPageCount > 0 && page > totalPageCount) {
      setPage(totalPageCount);
    }
  }, [page, totalPageCount]);

  // --- Filter helpers ---
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    (!firmId && filters.clientId !== 'all') ||
    filters.status !== 'all' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.minTotal !== '' ||
    filters.maxTotal !== '';

  const handleFilterChange = <K extends keyof DocumentFilters>(
    key: K,
    value: DocumentFilters[K]
  ) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearchTerm(value);
  };

  const handleResetFilters = () => {
    setPage(1);
    setSearchTerm('');
    setFilters({
      ...INITIAL_FILTERS,
      clientId: firmId ? String(firmId) : INITIAL_FILTERS.clientId
    });
  };

  // --- Selection helpers ---
  const pageIds = items.map((item) => item.id).filter((id): id is number => typeof id === 'number');
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const isPartiallySelected = pageIds.some((id) => selectedIds.includes(id)) && !isAllPageSelected;

  const toggleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedIds(pageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectItem = (id: number, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedIds((current) => (current.includes(id) ? current : [...current, id]));
    } else {
      setSelectedIds((current) => current.filter((i) => i !== id));
    }
  };

  // --- Common mutations ---
  const { mutate: removeItem, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => apiModule.remove(id),
    onSuccess: () => {
      if (items.length === 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing(`${translationKey}.action_remove_success`));
      refetchList();
      setDeleteDialog(false);
    },
    onError: (err) => {
      toast.error(
        getErrorMessage('invoicing', err, tInvoicing(`${translationKey}.action_remove_failure`))
      );
    }
  });

  const { mutate: duplicateItem, isPending: isDuplicationPending } = useMutation({
    mutationFn: (dto: any) => apiModule.duplicate(dto),
    onSuccess: async (data: any) => {
      toast.success(tInvoicing(`${translationKey}.action_duplicate_success`));
      await router.push(`${detailPathPrefix}/${data.id}`);
      setDuplicateDialog(false);
    },
    onError: (err) => {
      toast.error(
        getErrorMessage('invoicing', err, tInvoicing(`${translationKey}.action_duplicate_failure`))
      );
    }
  });

  const { mutate: downloadItem, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      apiModule.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing(`${translationKey}.action_download_success`));
      setDownloadDialog(false);
    },
    onError: (err) => {
      toast.error(
        getErrorMessage('invoicing', err, tInvoicing(`${translationKey}.action_download_failure`))
      );
    }
  });

  const closePreviewDialog = () => {
    setPreviewDialog(false);
    setPreviewBlob(null);
  };

  const { mutate: loadPreview, isPending: isPreviewPending } = useMutation({
    mutationFn: (id: number) => {
      if (!apiModule.preview) throw new Error('Preview not supported');
      return apiModule.preview(id, 'template1');
    },
    onSuccess: (blob) => {
      setPreviewBlob(blob);
      setPreviewDialog(true);
    },
    onError: (err) => {
      toast.error(
        getErrorMessage('invoicing', err, tInvoicing(`${translationKey}.action_preview_failure`))
      );
      closePreviewDialog();
    }
  });

  const isPending =
    isFetchPending ||
    isFetchFirmsPending ||
    isDeletePending ||
    isDuplicationPending ||
    isDownloadPending ||
    isPreviewPending ||
    searching ||
    filtering ||
    !commonReady ||
    !invoicingReady;

  return {
    // Translation
    tCommon,
    tInvoicing,
    i18n,
    dateLocale,
    numberLocale,
    activityType,
    partnerLabel,
    partnerPlaceholder,
    allPartnersLabel,
    // Router
    router,
    // Layout
    setIntro,
    clearIntro,
    setRoutes,
    clearRoutes,
    setFloating,
    clearFloating,
    // Pagination state
    page,
    setPage,
    size,
    setSize,
    totalPageCount,
    totalResultCount,
    // Filter state
    searchTerm,
    filters,
    isAdvancedFiltersOpen,
    setIsAdvancedFiltersOpen,
    hasActiveFilters,
    handleFilterChange,
    handleSearchChange,
    handleResetFilters,
    debouncedSearchTerm,
    debouncedFilters,
    // Selection
    selectedIds,
    setSelectedIds,
    pageIds,
    isAllPageSelected,
    isPartiallySelected,
    toggleSelectAll,
    toggleSelectItem,
    // Data
    items,
    firms,
    error,
    refetchList,
    // Dialog states
    deleteDialog,
    setDeleteDialog,
    duplicateDialog,
    setDuplicateDialog,
    downloadDialog,
    setDownloadDialog,
    previewDialog,
    setPreviewDialog,
    previewBlob,
    closePreviewDialog,
    // Mutations
    removeItem,
    duplicateItem,
    downloadItem,
    loadPreview,
    // Pending flags
    isPending,
    isFetchPending,
    isDeletePending,
    isDuplicationPending,
    isDownloadPending,
    isPreviewPending
  };
}

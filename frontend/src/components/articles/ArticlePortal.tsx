import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Ellipsis,
  Image as ImageIcon,
  Import,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Paperclip,
  SlidersHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useGuardedNavigation } from '@/features/rbac/useGuardedNavigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useAuthSyncStatus } from '@/hooks/other/useAuthSyncStatus';
import { cn } from '@/lib/utils';
import { Article } from '@/types';
import { getErrorMessage } from '@/utils/errors';

interface ArticlePortalProps {
  className?: string;
}

type DestinationFilter = Article['destination'] | 'all';
type TypeFilter = Article['articleType'] | 'all';
type GenericFilter = string;

type ArticleImagePreview = {
  blob: Blob;
  title: string;
};

const panelClassName =
  'rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950';
const fieldClassName =
  'h-10 rounded-sm border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950';
const labelClassName = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const textClassName = 'text-zinc-700 dark:text-zinc-300';
const mutedTextClassName = 'text-zinc-500 dark:text-zinc-400';
const tableGridClassName =
  'grid min-w-[780px] grid-cols-[minmax(260px,2.1fr)_minmax(130px,1.2fr)_minmax(130px,1.2fr)_minmax(120px,1fr)_72px] gap-4';

export const ArticlePortal = ({ className }: ArticlePortalProps) => {
  const router = useRouter();
  const guardedNavigation = useGuardedNavigation();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tArticles } = useTranslation('articles');
  const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();
  const { setRoutes, clearRoutes } = useBreadcrumb();
  const { isProtectedDataReady } = useAuthSyncStatus();

  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(20);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [destinationFilter, setDestinationFilter] = React.useState<DestinationFilter>('all');
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('all');
  const [familyFilter, setFamilyFilter] = React.useState<GenericFilter>('all');
  const [subFamilyFilter, setSubFamilyFilter] = React.useState<GenericFilter>('all');
  const [brandFilter, setBrandFilter] = React.useState<GenericFilter>('all');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = React.useState(true);
  const [imagePreview, setImagePreview] = React.useState<ArticleImagePreview | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState('');
  const importInputRef = React.useRef<HTMLInputElement | null>(null);
  const floatingStateRef = React.useRef({
    searchTerm: '',
    destinationFilter: 'all' as DestinationFilter,
    typeFilter: 'all' as TypeFilter,
    familyFilter: 'all',
    subFamilyFilter: 'all',
    brandFilter: 'all',
    size: 20,
    totalResultCount: 0,
    tArticles,
    tCommon
  });

  const { value: debouncedSearchTerm, loading: searching } = useDebounce(searchTerm, 400);
  const { value: debouncedDestinationFilter, loading: filteringDestination } = useDebounce(
    destinationFilter,
    300
  );
  const { value: debouncedTypeFilter, loading: filteringType } = useDebounce(typeFilter, 300);
  const { value: debouncedFamilyFilter, loading: filteringFamily } = useDebounce(familyFilter, 300);
  const { value: debouncedSubFamilyFilter, loading: filteringSubFamily } = useDebounce(
    subFamilyFilter,
    300
  );
  const { value: debouncedBrandFilter, loading: filteringBrand } = useDebounce(brandFilter, 300);

  const downloadFile = React.useCallback((content: string, filename: string) => {
    const blob = new Blob([`\uFEFF${content}`], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const openImportDialog = React.useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleCreateArticle = React.useCallback(() => {
    guardedNavigation.push('/articles/new');
  }, [guardedNavigation]);

  const exportArticles = React.useCallback(async () => {
    const {
      searchTerm: currentSearchTerm,
      destinationFilter: currentDestinationFilter,
      typeFilter: currentTypeFilter,
      familyFilter: currentFamilyFilter,
      subFamilyFilter: currentSubFamilyFilter,
      brandFilter: currentBrandFilter,
      size: currentSize,
      totalResultCount: currentTotalResultCount,
      tArticles: currentTArticles
    } = floatingStateRef.current;

    const exportLimit = Math.max(currentTotalResultCount || 0, currentSize, 50);
    const exportResp = await api.article.findPaginated(1, exportLimit, 'DESC', 'createdAt', {
      search: currentSearchTerm,
      destination: currentDestinationFilter,
      articleType: currentTypeFilter,
      family: currentFamilyFilter,
      subFamily: currentSubFamilyFilter,
      brand: currentBrandFilter
    });

    const rows = exportResp.data.map((article) =>
      [
        article.title || '',
        article.reference || '',
        article.destination ? currentTArticles(`destination.${article.destination}`) : '',
        article.articleType ? currentTArticles(`type.${article.articleType}`) : '',
        article.family || '',
        article.subFamily || '',
        article.brand || '',
        Number(article.salePrice || 0).toFixed(3),
        Number(article.purchasePrice || 0).toFixed(3)
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );

    downloadFile(
      [
        [
          currentTArticles('fields.article_name'),
          currentTArticles('fields.reference'),
          currentTArticles('fields.destination'),
          currentTArticles('fields.article_type'),
          currentTArticles('fields.family'),
          currentTArticles('fields.sub_family'),
          currentTArticles('fields.brand'),
          currentTArticles('fields.sale_price'),
          currentTArticles('fields.purchase_price')
        ]
          .map((value) => `"${value}"`)
          .join(','),
        ...rows
      ].join('\n'),
      `articles-${new Date().toISOString().slice(0, 10)}.csv`
    );

    toast.success(currentTArticles('messages.export_success'));
  }, [downloadFile]);

  const {
    isPending: isFetchPending,
    error,
    data: articlesResp,
    refetch: refetchArticles
  } = useQuery({
    queryKey: [
      'articles',
      page,
      size,
      debouncedSearchTerm,
      debouncedDestinationFilter,
      debouncedTypeFilter,
      debouncedFamilyFilter,
      debouncedSubFamilyFilter,
      debouncedBrandFilter
    ],
    enabled: isProtectedDataReady,
    retry: false,
    queryFn: () =>
      api.article.findPaginated(page, size, 'DESC', 'createdAt', {
        search: debouncedSearchTerm,
        destination: debouncedDestinationFilter,
        articleType: debouncedTypeFilter,
        family: debouncedFamilyFilter,
        subFamily: debouncedSubFamilyFilter,
        brand: debouncedBrandFilter
      })
  });

  const { data: articleChoices = [] } = useQuery({
    queryKey: ['article-filter-choices'],
    queryFn: () => api.article.findAll(),
    enabled: isProtectedDataReady,
    retry: false,
    staleTime: 60_000
  });

  const { mutate: removeArticle, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.article.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(tArticles('messages.delete_success'));
      refetchArticles();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('articles', mutationError, tArticles('messages.delete_error')));
    }
  });

  React.useEffect(() => {
    if (!imagePreview?.blob) {
      setImagePreviewUrl('');
      return;
    }

    const nextImagePreviewUrl = window.URL.createObjectURL(imagePreview.blob);
    setImagePreviewUrl(nextImagePreviewUrl);

    return () => {
      window.URL.revokeObjectURL(nextImagePreviewUrl);
    };
  }, [imagePreview]);

  const handleViewArticleImage = React.useCallback(
    async (article: Article) => {
      if (!article.imageId) return;

      const blob = await api.upload.fetchBlobById(article.imageId);
      if (!blob) {
        toast.error(tArticles('messages.image_preview_error'));
        return;
      }

      setImagePreview({
        blob,
        title: article.title || tArticles('singular')
      });
    },
    [tArticles]
  );

  const handleDownloadArticleAttachments = React.useCallback(
    async (article: Article) => {
      const attachmentIds = article.attachmentIds || [];
      if (attachmentIds.length === 0) return;

      let downloadedCount = 0;
      try {
        for (const attachmentId of attachmentIds) {
          const attachment = await api.upload.findOne(attachmentId);
          if (attachment.slug) {
            await api.upload.downloadFile(attachment.slug, attachment.filename);
            downloadedCount += 1;
            continue;
          }

          const blob = await api.upload.fetchBlobById(attachmentId);
          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.filename || `article-attachment-${attachmentId}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            downloadedCount += 1;
          }
        }
      } catch {
        toast.error(tArticles('messages.attachments_download_error'));
        return;
      }

      if (downloadedCount > 0) {
        toast.success(tArticles('messages.attachments_download_success', { count: downloadedCount }));
      } else {
        toast.error(tArticles('messages.attachments_download_error'));
      }
    },
    [tArticles]
  );

  const articles = React.useMemo(() => articlesResp?.data || [], [articlesResp]);
  const totalPageCount = articlesResp?.meta.pageCount || 0;
  const totalResultCount = articlesResp?.meta.itemCount || 0;
  const familyOptions = React.useMemo(
    () =>
      Array.from(new Set(articleChoices.map((article) => article.family).filter(Boolean))).sort(),
    [articleChoices]
  );
  const subFamilyOptions = React.useMemo(() => {
    return Array.from(
      new Set(
        articleChoices
          .filter((article) => familyFilter === 'all' || article.family === familyFilter)
          .map((article) => article.subFamily)
          .filter(Boolean)
      )
    ).sort();
  }, [articleChoices, familyFilter]);
  const brandOptions = React.useMemo(() => {
    return Array.from(
      new Set(
        articleChoices
          .filter((article) => familyFilter === 'all' || article.family === familyFilter)
          .filter((article) => subFamilyFilter === 'all' || article.subFamily === subFamilyFilter)
          .map((article) => article.brand)
          .filter(Boolean)
      )
    ).sort();
  }, [articleChoices, familyFilter, subFamilyFilter]);

  React.useEffect(() => {
    floatingStateRef.current = {
      searchTerm,
      destinationFilter,
      typeFilter,
      familyFilter,
      subFamilyFilter,
      brandFilter,
      size,
      totalResultCount,
      tArticles,
      tCommon
    };
  }, [
    brandFilter,
    destinationFilter,
    familyFilter,
    searchTerm,
    size,
    subFamilyFilter,
    tArticles,
    tCommon,
    totalResultCount,
    typeFilter
  ]);

  React.useEffect(() => {
    if (totalPageCount > 0 && page > totalPageCount) {
      setPage(totalPageCount);
    }
  }, [page, totalPageCount]);

  React.useEffect(() => {
    if (
      familyFilter !== 'all' &&
      familyOptions.length > 0 &&
      !familyOptions.includes(familyFilter)
    ) {
      setFamilyFilter('all');
    }
  }, [familyFilter, familyOptions]);

  React.useEffect(() => {
    if (
      subFamilyFilter !== 'all' &&
      subFamilyOptions.length > 0 &&
      !subFamilyOptions.includes(subFamilyFilter)
    ) {
      setSubFamilyFilter('all');
    }
  }, [subFamilyFilter, subFamilyOptions]);

  React.useEffect(() => {
    if (brandFilter !== 'all' && brandOptions.length > 0 && !brandOptions.includes(brandFilter)) {
      setBrandFilter('all');
    }
  }, [brandFilter, brandOptions]);

  React.useEffect(() => {
    setIntro?.(tArticles('portal.title'), tArticles('portal.description'));
    setRoutes?.([{ title: tCommon('menu.articles') }]);
    setFloating?.(
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 rounded-sm px-4">
              <Ellipsis className="h-4 w-4" />
              {tArticles('portal.actions')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={exportArticles}>
              <Download className="mr-2 h-4 w-4" />
              {tArticles('actions.export_excel')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openImportDialog}>
              <Import className="mr-2 h-4 w-4" />
              {tArticles('actions.import_excel')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="h-10 rounded-sm px-5" onClick={handleCreateArticle}>
          <Plus className="h-4 w-4" />
          {tCommon('commands.create')}
        </Button>
      </div>
    );

    return () => {
      clearIntro?.();
      clearRoutes?.();
      clearFloating?.();
    };
  }, [
    clearFloating,
    clearIntro,
    clearRoutes,
    exportArticles,
    handleCreateArticle,
    openImportDialog,
    setFloating,
    setIntro,
    setRoutes,
    tArticles,
    tCommon
  ]);

  const isPending =
    isFetchPending ||
    isDeletePending ||
    searching ||
    filteringDestination ||
    filteringType ||
    filteringFamily ||
    filteringSubFamily ||
    filteringBrand;

  if (error) {
    return tArticles('messages.load_error');
  }

  return (
    <>
      <div className={cn('flex min-h-0 flex-1 flex-col gap-5 pb-6', className)}>
        <input
          ref={importInputRef}
          type="file"
          accept=".xls,.xlsx,.ods,.csv"
          className="hidden"
          onChange={(event) => {
            if (!event.target.files?.length) return;

            toast.info(tArticles('messages.import_placeholder'));
            event.target.value = '';
          }}
        />

      <section className={cn(panelClassName, 'p-4')}>
        <div className="flex items-start justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                mutedTextClassName
              )}
            />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
              placeholder={tArticles('placeholders.search_portal')}
              className={cn(fieldClassName, 'pl-10')}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 w-14 rounded-sm px-0"
              onClick={() => setIsAdvancedFiltersOpen((current) => !current)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <ChevronUp
                className={cn(
                  'h-4 w-4 transition-transform',
                  !isAdvancedFiltersOpen && 'rotate-180'
                )}
              />
            </Button>
          </div>
        </div>

        {isAdvancedFiltersOpen && (
          <div className="mt-4 grid gap-4 xl:grid-cols-[160px_160px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-2">
              <p className={labelClassName}>{tArticles('filters.article_type')}</p>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setTypeFilter(value as TypeFilter);
                }}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tArticles('filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tArticles('filters.all')}</SelectItem>
                  <SelectItem value="product">{tArticles('type.product')}</SelectItem>
                  <SelectItem value="service">{tArticles('type.service')}</SelectItem>
                  <SelectItem value="asset">{tArticles('type.asset')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className={labelClassName}>{tArticles('filters.destination')}</p>
              <Select
                value={destinationFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setDestinationFilter(value as DestinationFilter);
                }}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tArticles('filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tArticles('filters.all')}</SelectItem>
                  <SelectItem value="selling">{tArticles('destination.selling')}</SelectItem>
                  <SelectItem value="buying">{tArticles('destination.buying')}</SelectItem>
                  <SelectItem value="both">{tArticles('destination.both')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className={labelClassName}>{tArticles('filters.family')}</p>
              <Select
                value={familyFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setFamilyFilter(value);
                  setSubFamilyFilter('all');
                  setBrandFilter('all');
                }}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tArticles('placeholders.select_family')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tArticles('filters.all')}</SelectItem>
                  {familyOptions.map((family) => (
                    <SelectItem key={family} value={family!}>
                      {family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className={labelClassName}>{tArticles('filters.sub_family')}</p>
              <Select
                value={subFamilyFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setSubFamilyFilter(value);
                  setBrandFilter('all');
                }}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tArticles('placeholders.select_sub_family')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tArticles('filters.all')}</SelectItem>
                  {subFamilyOptions.map((subFamily) => (
                    <SelectItem key={subFamily} value={subFamily!}>
                      {subFamily}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className={labelClassName}>{tArticles('filters.brand')}</p>
              <Select
                value={brandFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setBrandFilter(value);
                }}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder={tArticles('placeholders.select_brand')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tArticles('filters.all')}</SelectItem>
                  {brandOptions.map((brand) => (
                    <SelectItem key={brand} value={brand!}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </section>

      <section className={cn(panelClassName, 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
        <div className="min-h-0 flex-1 overflow-auto">
          <div
            className={cn(
              tableGridClassName,
              'sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 px-5 py-3.5 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
            )}
          >
            <span>{tArticles('fields.article_name')}</span>
            <span>{tArticles('fields.sale_price')}</span>
            <span>{tArticles('fields.purchase_price')}</span>
            <span>{tArticles('fields.article_type')}</span>
            <span className="text-right">{tCommon('commands.actions')}</span>
          </div>

          {isPending ? (
            <Spinner className="min-h-[320px]" show />
          ) : articles.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center text-base text-zinc-500 dark:text-zinc-400">
              {tArticles('portal.empty')}
            </div>
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                className={cn(
                  tableGridClassName,
                  'items-center border-b border-zinc-300/80 px-5 py-4 text-sm dark:border-zinc-700/80'
                )}
              >
                <div className="min-w-0">
                  <p className={cn(textClassName, 'truncate font-medium')}>
                    {article.title || '-'}
                  </p>
                  {article.reference ? (
                    <p className={cn(mutedTextClassName, 'truncate text-xs')}>
                      {article.reference}
                    </p>
                  ) : null}
                </div>
                <span className={textClassName}>
                  {Number(article.salePrice || 0).toFixed(3)} DT
                </span>
                <span className={textClassName}>
                  {Number(article.purchasePrice || 0).toFixed(3)} DT
                </span>
                <span className={textClassName}>
                  {article.articleType ? tArticles(`type.${article.articleType}`) : '-'}
                </span>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm">
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        disabled={!article.imageId}
                        onClick={() => handleViewArticleImage(article)}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {tArticles('actions.view_image')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={(article.attachmentIds || []).length === 0}
                        onClick={() => handleDownloadArticleAttachments(article)}
                      >
                        <Paperclip className="mr-2 h-4 w-4" />
                        {tArticles('actions.download_attachments')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => guardedNavigation.push(`/articles/${article.id}`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {tCommon('commands.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          if (
                            article.id &&
                            window.confirm(
                              tArticles('messages.delete_confirm', { title: article.title || '' })
                            )
                          ) {
                            removeArticle(article.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tCommon('commands.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {tArticles('portal.rows')}
              </span>
              <Select
                value={String(size)}
                onValueChange={(value) => {
                  setPage(1);
                  setSize(Number(value));
                }}
              >
                <SelectTrigger className="h-10 w-[72px] rounded-sm border-zinc-200 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Page {totalPageCount === 0 ? 0 : page} sur {totalPageCount}
              </span>

              <span>
                {totalResultCount === 0
                  ? tArticles('portal.results_summary_empty')
                  : tArticles('portal.results_summary', { count: totalResultCount })}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-sm"
                disabled={page <= 1 || totalPageCount === 0}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-sm"
                disabled={page >= totalPageCount || totalPageCount === 0}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      </div>

      <Dialog open={!!imagePreview} onOpenChange={(open) => !open && setImagePreview(null)}>
        <DialogContent className="w-[min(92vw,720px)] max-w-none rounded-md">
          <DialogHeader>
            <DialogTitle>{imagePreview?.title || tArticles('fields.image')}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt={imagePreview?.title || tArticles('fields.image')}
                className="max-h-[64vh] w-auto max-w-full object-contain"
              />
            ) : (
              <div className="py-16 text-sm text-zinc-500 dark:text-zinc-400">
                {tArticles('messages.image_preview_empty')}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

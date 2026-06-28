import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GoodsIssueNoteDuplicateDialog } from './dialogs/GoodsIssueNoteDuplicateDialog';
import { useTranslation } from 'react-i18next';
import { GoodsIssueNoteDeleteDialog } from './dialogs/GoodsIssueNoteDeleteDialog';
import { GoodsIssueNoteDownloadDialog } from './dialogs/GoodsIssueNoteDownloadDialog';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { useGoodsIssueNoteColumns } from './columns';
import { useGoodsIssueNoteManager } from './hooks/useGoodsIssueNoteManager';
import { DuplicateGoodsIssueNoteDto, GoodsIssueNote } from '@/types';
import ContentSection from '@/components/shared/ContentSection';
import { cn } from '@/lib/utils';
import { BreadcrumbRoute, useBreadcrumb } from '@/context/BreadcrumbContext';

interface GoodsIssueNoteEmbeddedPortalProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const GoodsIssueNoteEmbeddedPortal: React.FC<GoodsIssueNoteEmbeddedPortalProps> = ({
  className,
  firmId,
  interlocutorId,
  routes
}) => {
  const router = useRouter();

  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    if (routes && (firmId || interlocutorId))
      setRoutes?.([...routes, { title: tInvoicing('goodsIssueNote.plural') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const goodsIssueNoteManager = useGoodsIssueNoteManager();

  const [page, setPage] = React.useState(1);
  const { value: debouncedPage, loading: paging } = useDebounce<number>(page, 500);

  const [size, setSize] = React.useState(5);
  const { value: debouncedSize, loading: resizing } = useDebounce<number>(size, 500);

  const [sortDetails, setSortDetails] = React.useState({ order: true, sortKey: 'id' });
  const { value: debouncedSortDetails, loading: sorting } = useDebounce<typeof sortDetails>(
    sortDetails,
    500
  );

  const [searchTerm, setSearchTerm] = React.useState('');
  const { value: debouncedSearchTerm, loading: searching } = useDebounce<string>(searchTerm, 500);

  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: goodsIssueNotesResp,
    refetch: refetchGoodsIssueNotes
  } = useQuery({
    queryKey: [
      'goodsIssueNotes',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.goodsIssueNote.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['firm', 'interlocutor', 'currency'],
        firmId,
        interlocutorId
      )
  });

  const goodsIssueNotes = React.useMemo(() => {
    return goodsIssueNotesResp?.data || [];
  }, [goodsIssueNotesResp]);

  const context: DataTableConfig<GoodsIssueNote> = {
    singularName: tInvoicing('goodsIssueNote.singular'),
    pluralName: tInvoicing('goodsIssueNote.plural'),
    //dialogs
    deleteCallback: () => setDeleteDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: goodsIssueNotesResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  const columns = useGoodsIssueNoteColumns(context, firmId, interlocutorId);

  //Remove GoodsIssueNote
  const { mutate: removeGoodsIssueNote, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.goodsIssueNote.remove(id),
    onSuccess: () => {
      if (goodsIssueNotes?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('goodsIssueNote.action_remove_success'));
      refetchGoodsIssueNotes();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('goodsIssueNote.action_remove_failure'))
      );
    }
  });

  //Duplicate GoodsIssueNote
  const { mutate: duplicateGoodsIssueNote, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateGoodsIssueNoteDto: DuplicateGoodsIssueNoteDto) =>
      api.goodsIssueNote.duplicate(duplicateGoodsIssueNoteDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('goodsIssueNote.action_duplicate_success'));
      await router.push('/selling/goods-issue-note/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('goodsIssueNote.action_duplicate_failure'))
      );
    }
  });

  //Download GoodsIssueNote
  const { mutate: downloadGoodsIssueNote, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.goodsIssueNote.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('goodsIssueNote.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('goodsIssueNote.action_download_failure'))
      );
    }
  });

  const isPending =
    isFetchPending ||
    isDeletePending ||
    paging ||
    resizing ||
    searching ||
    sorting ||
    !commonReady ||
    !invoicingReady;

  if (error) return 'An error has occurred: ' + error.message;
  return (
    <ContentSection
      title={tInvoicing('goodsIssueNote.plural')}
      desc={tInvoicing('goodsIssueNote.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}
    >
      <>
        <GoodsIssueNoteDeleteDialog
          id={goodsIssueNoteManager?.id}
          sequential={goodsIssueNoteManager?.sequential || ''}
          open={deleteDialog}
          deleteGoodsIssueNote={() => {
            goodsIssueNoteManager?.id && removeGoodsIssueNote(goodsIssueNoteManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
        <GoodsIssueNoteDuplicateDialog
          id={goodsIssueNoteManager?.id || 0}
          sequential={goodsIssueNoteManager?.sequential || ''}
          open={duplicateDialog}
          duplicateGoodsIssueNote={(includeFiles: boolean) => {
            goodsIssueNoteManager?.id &&
              duplicateGoodsIssueNote({
                id: goodsIssueNoteManager?.id,
                includeFiles: includeFiles
              });
          }}
          isDuplicationPending={isDuplicationPending}
          onClose={() => setDuplicateDialog(false)}
        />
        <GoodsIssueNoteDownloadDialog
          id={goodsIssueNoteManager?.id || 0}
          open={downloadDialog}
          downloadGoodsIssueNote={(template: string) => {
            goodsIssueNoteManager?.id &&
              downloadGoodsIssueNote({ id: goodsIssueNoteManager?.id, template });
          }}
          isDownloadPending={isDownloadPending}
          onClose={() => setDownloadDialog(false)}
        />
        <DataTable
          context={context}
          className="flex flex-col flex-1 overflow-hidden p-1"
          containerClassName="overflow-auto"
          data={goodsIssueNotes}
          columns={columns}
          isPending={isPending}
        />
      </>
    </ContentSection>
  );
};

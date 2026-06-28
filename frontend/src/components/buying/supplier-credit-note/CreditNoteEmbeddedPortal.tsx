import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { DuplicateCreditNoteDto, CreditNote } from '@/types';
import ContentSection from '@/components/shared/ContentSection';
import { cn } from '@/lib/utils';
import { BreadcrumbRoute, useBreadcrumb } from '@/context/BreadcrumbContext';

import { useCreditNoteManager } from './hooks/useCreditNoteManager';
import { CreditNoteDeleteDialog } from './dialogs/CreditNoteDeleteDialog';
import { CreditNoteDuplicateDialog } from './dialogs/CreditNoteDuplicateDialog';
import { CreditNoteDownloadDialog } from './dialogs/CreditNoteDownloadDialog';
import { useCreditNoteColumns } from './columns';

interface CreditNoteEmbeddedPortalProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const CreditNoteEmbeddedPortal: React.FC<CreditNoteEmbeddedPortalProps> = ({
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
      setRoutes?.([...routes, { title: tInvoicing('creditNote.plural') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const creditNoteManager = useCreditNoteManager();

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
    data: creditNotesResp,
    refetch: refetchCreditNotes
  } = useQuery({
    queryKey: [
      'creditNotes',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.creditNote.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['firm', 'interlocutor', 'currency', 'payments'],
        firmId,
        interlocutorId
      )
  });

  const creditNotes = React.useMemo(() => {
    return creditNotesResp?.data || [];
  }, [creditNotesResp]);

  const context: DataTableConfig<CreditNote> = {
    singularName: tInvoicing('creditNote.singular'),
    pluralName: tInvoicing('creditNote.plural'),
    // dialogs
    deleteCallback: () => setDeleteDialog(true),
    // search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: creditNotesResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  const columns = useCreditNoteColumns(context, firmId, interlocutorId);

  // Remove CreditNote
  const { mutate: removeCreditNote, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.creditNote.remove(id),
    onSuccess: () => {
      if (creditNotes?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('creditNote.action_remove_success'));
      refetchCreditNotes();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('creditNote.action_remove_failure'))
      );
    }
  });

  // Duplicate CreditNote
  const { mutate: duplicateCreditNote, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateCreditNoteDto: DuplicateCreditNoteDto) =>
      api.creditNote.duplicate(duplicateCreditNoteDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('creditNote.action_duplicate_success'));
      await router.push('/buying/avoir-fournisseur/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('creditNote.action_duplicate_failure'))
      );
    }
  });

  // Download CreditNote
  const { mutate: downloadCreditNote, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.creditNote.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('creditNote.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('creditNote.action_download_failure'))
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
      title={tInvoicing('creditNote.plural')}
      desc={tInvoicing('creditNote.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}
    >
      <>
        <CreditNoteDeleteDialog
          id={creditNoteManager?.id}
          sequential={creditNoteManager?.sequential || ''}
          open={deleteDialog}
          deleteCreditNote={() => {
            creditNoteManager?.id && removeCreditNote(creditNoteManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
        <CreditNoteDuplicateDialog
          id={creditNoteManager?.id || 0}
          sequential={creditNoteManager?.sequential || ''}
          open={duplicateDialog}
          duplicateCreditNote={(includeFiles: boolean) => {
            creditNoteManager?.id &&
              duplicateCreditNote({
                id: creditNoteManager?.id,
                includeFiles: includeFiles
              });
          }}
          isDuplicationPending={isDuplicationPending}
          onClose={() => setDuplicateDialog(false)}
        />
        <CreditNoteDownloadDialog
          id={creditNoteManager?.id || 0}
          open={downloadDialog}
          downloadCreditNote={(template: string) => {
            creditNoteManager?.id && downloadCreditNote({ id: creditNoteManager?.id, template });
          }}
          isDownloadPending={isDownloadPending}
          onClose={() => setDownloadDialog(false)}
        />
        <DataTable
          context={context}
          className="flex flex-col flex-1 overflow-hidden p-1"
          containerClassName="overflow-auto"
          data={creditNotes}
          columns={columns}
          isPending={isPending}
        />
      </>
    </ContentSection>
  );
};

import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ReturnNoteDuplicateDialog } from './dialogs/ReturnNoteDuplicateDialog';
import { useTranslation } from 'react-i18next';
import { ReturnNoteDeleteDialog } from './dialogs/ReturnNoteDeleteDialog';
import { ReturnNoteDownloadDialog } from './dialogs/ReturnNoteDownloadDialog';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { useReturnNoteColumns } from './columns';
import { useReturnNoteManager } from './hooks/useReturnNoteManager';
import { DuplicateReturnNoteDto, ReturnNote } from '@/types';
import { ReturnNoteInvoiceDialog } from './dialogs/ReturnNoteInvoiceDialog';
import ContentSection from '@/components/shared/ContentSection';
import { cn } from '@/lib/utils';
import { BreadcrumbRoute, useBreadcrumb } from '@/context/BreadcrumbContext';

interface ReturnNoteEmbeddedPortalProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const ReturnNoteEmbeddedPortal: React.FC<ReturnNoteEmbeddedPortalProps> = ({
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
      setRoutes?.([...routes, { title: tInvoicing('returnNote.plural') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const returnNoteManager = useReturnNoteManager();

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
  const [invoiceDialog, setInvoiceDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: returnNotesResp,
    refetch: refetchReturnNotes
  } = useQuery({
    queryKey: [
      'returnNotes',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.returnNote.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['firm', 'interlocutor', 'currency', 'invoices'],
        firmId,
        interlocutorId
      )
  });

  const returnNotes = React.useMemo(() => {
    return returnNotesResp?.data || [];
  }, [returnNotesResp]);

  const context: DataTableConfig<ReturnNote> = {
    singularName: tInvoicing('returnNote.singular'),
    pluralName: tInvoicing('returnNote.plural'),
    //dialogs
    deleteCallback: () => setDeleteDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: returnNotesResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  const columns = useReturnNoteColumns(context, firmId, interlocutorId);

  //Remove ReturnNote
  const { mutate: removeReturnNote, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.returnNote.remove(id),
    onSuccess: () => {
      if (returnNotes?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('returnNote.action_remove_success'));
      refetchReturnNotes();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('returnNote.action_remove_failure'))
      );
    }
  });

  //Duplicate ReturnNote
  const { mutate: duplicateReturnNote, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateReturnNoteDto: DuplicateReturnNoteDto) =>
      api.returnNote.duplicate(duplicateReturnNoteDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('returnNote.action_duplicate_success'));
      await router.push('/buying/retour-fournisseur/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('returnNote.action_duplicate_failure'))
      );
    }
  });

  //Download ReturnNote
  const { mutate: downloadReturnNote, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.returnNote.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('returnNote.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('returnNote.action_download_failure'))
      );
    }
  });

  //Invoice returnNote
  const { mutate: invoiceReturnNote, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.returnNote.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success(tInvoicing('returnNote.action_invoice_success'));
      refetchReturnNotes();
      router.push(`/buying/facture-achat/${data.invoices[data?.invoices?.length - 1].id}`);
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('returnNote.action_invoice_failure')
      );
      toast.error(message);
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
      title={tInvoicing('returnNote.plural')}
      desc={tInvoicing('returnNote.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}
    >
      <>
        <ReturnNoteDeleteDialog
          id={returnNoteManager?.id}
          sequential={returnNoteManager?.sequential || ''}
          open={deleteDialog}
          deleteReturnNote={() => {
            returnNoteManager?.id && removeReturnNote(returnNoteManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
        <ReturnNoteDuplicateDialog
          id={returnNoteManager?.id || 0}
          sequential={returnNoteManager?.sequential || ''}
          open={duplicateDialog}
          duplicateReturnNote={(includeFiles: boolean) => {
            returnNoteManager?.id &&
              duplicateReturnNote({
                id: returnNoteManager?.id,
                includeFiles: includeFiles
              });
          }}
          isDuplicationPending={isDuplicationPending}
          onClose={() => setDuplicateDialog(false)}
        />
        <ReturnNoteDownloadDialog
          id={returnNoteManager?.id || 0}
          open={downloadDialog}
          downloadReturnNote={(template: string) => {
            returnNoteManager?.id && downloadReturnNote({ id: returnNoteManager?.id, template });
          }}
          isDownloadPending={isDownloadPending}
          onClose={() => setDownloadDialog(false)}
        />
        <ReturnNoteInvoiceDialog
          id={returnNoteManager?.id || 0}
          status={returnNoteManager?.status}
          sequential={returnNoteManager?.sequential}
          open={invoiceDialog}
          isInvoicePending={isInvoicingPending}
          invoice={(id: number, createInvoice: boolean) => {
            invoiceReturnNote({ id, createInvoice });
          }}
          onClose={() => setInvoiceDialog(false)}
        />
        <DataTable
          context={context}
          className="flex flex-col flex-1 overflow-hidden p-1"
          containerClassName="overflow-auto"
          data={returnNotes}
          columns={columns}
          isPending={isPending}
        />
      </>
    </ContentSection>
  );
};

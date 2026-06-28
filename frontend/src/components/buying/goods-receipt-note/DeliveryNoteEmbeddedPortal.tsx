import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DeliveryNoteDuplicateDialog } from './dialogs/DeliveryNoteDuplicateDialog';
import { useTranslation } from 'react-i18next';
import { DeliveryNoteDeleteDialog } from './dialogs/DeliveryNoteDeleteDialog';
import { DeliveryNoteDownloadDialog } from './dialogs/DeliveryNoteDownloadDialog';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { useDeliveryNoteColumns } from './columns';
import { useDeliveryNoteManager } from './hooks/useDeliveryNoteManager';
import { DuplicateDeliveryNoteDto, DeliveryNote } from '@/types';
import { DeliveryNoteInvoiceDialog } from './dialogs/DeliveryNoteInvoiceDialog';
import ContentSection from '@/components/shared/ContentSection';
import { cn } from '@/lib/utils';
import { BreadcrumbRoute, useBreadcrumb } from '@/context/BreadcrumbContext';

interface DeliveryNoteEmbeddedPortalProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const DeliveryNoteEmbeddedPortal: React.FC<DeliveryNoteEmbeddedPortalProps> = ({
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
      setRoutes?.([...routes, { title: tInvoicing('deliveryNote.plural') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const deliveryNoteManager = useDeliveryNoteManager();

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
    data: deliveryNotesResp,
    refetch: refetchDeliveryNotes
  } = useQuery({
    queryKey: [
      'deliveryNotes',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.deliveryNote.findPaginated(
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

  const deliveryNotes = React.useMemo(() => {
    return deliveryNotesResp?.data || [];
  }, [deliveryNotesResp]);

  const context: DataTableConfig<DeliveryNote> = {
    singularName: tInvoicing('deliveryNote.singular'),
    pluralName: tInvoicing('deliveryNote.plural'),
    //dialogs
    deleteCallback: () => setDeleteDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: deliveryNotesResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  const columns = useDeliveryNoteColumns(context, firmId, interlocutorId);

  //Remove DeliveryNote
  const { mutate: removeDeliveryNote, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.deliveryNote.remove(id),
    onSuccess: () => {
      if (deliveryNotes?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('deliveryNote.action_remove_success'));
      refetchDeliveryNotes();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_remove_failure'))
      );
    }
  });

  //Duplicate DeliveryNote
  const { mutate: duplicateDeliveryNote, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateDeliveryNoteDto: DuplicateDeliveryNoteDto) =>
      api.deliveryNote.duplicate(duplicateDeliveryNoteDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('deliveryNote.action_duplicate_success'));
      await router.push('/buying/bon-reception/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_duplicate_failure'))
      );
    }
  });

  //Download DeliveryNote
  const { mutate: downloadDeliveryNote, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.deliveryNote.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('deliveryNote.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('deliveryNote.action_download_failure'))
      );
    }
  });

  //Invoice deliveryNote
  const { mutate: invoiceDeliveryNote, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.deliveryNote.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success(tInvoicing('deliveryNote.action_invoice_success'));
      refetchDeliveryNotes();
      router.push(`/buying/facture-achat/${data.invoices[data?.invoices?.length - 1].id}`);
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('deliveryNote.action_invoice_failure')
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
      title={tInvoicing('deliveryNote.plural')}
      desc={tInvoicing('deliveryNote.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}
    >
      <>
        <DeliveryNoteDeleteDialog
          id={deliveryNoteManager?.id}
          sequential={deliveryNoteManager?.sequential || ''}
          open={deleteDialog}
          deleteDeliveryNote={() => {
            deliveryNoteManager?.id && removeDeliveryNote(deliveryNoteManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
        <DeliveryNoteDuplicateDialog
          id={deliveryNoteManager?.id || 0}
          sequential={deliveryNoteManager?.sequential || ''}
          open={duplicateDialog}
          duplicateDeliveryNote={(includeFiles: boolean) => {
            deliveryNoteManager?.id &&
              duplicateDeliveryNote({
                id: deliveryNoteManager?.id,
                includeFiles: includeFiles
              });
          }}
          isDuplicationPending={isDuplicationPending}
          onClose={() => setDuplicateDialog(false)}
        />
        <DeliveryNoteDownloadDialog
          id={deliveryNoteManager?.id || 0}
          open={downloadDialog}
          downloadDeliveryNote={(template: string) => {
            deliveryNoteManager?.id &&
              downloadDeliveryNote({ id: deliveryNoteManager?.id, template });
          }}
          isDownloadPending={isDownloadPending}
          onClose={() => setDownloadDialog(false)}
        />
        <DeliveryNoteInvoiceDialog
          id={deliveryNoteManager?.id || 0}
          status={deliveryNoteManager?.status}
          sequential={deliveryNoteManager?.sequential}
          open={invoiceDialog}
          isInvoicePending={isInvoicingPending}
          invoice={(id: number, createInvoice: boolean) => {
            invoiceDeliveryNote({ id, createInvoice });
          }}
          onClose={() => setInvoiceDialog(false)}
        />
        <DataTable
          context={context}
          className="flex flex-col flex-1 overflow-hidden p-1"
          containerClassName="overflow-auto"
          data={deliveryNotes}
          columns={columns}
          isPending={isPending}
        />
      </>
    </ContentSection>
  );
};

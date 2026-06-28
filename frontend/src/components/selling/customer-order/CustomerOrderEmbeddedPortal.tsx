import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CustomerOrderDuplicateDialog } from './dialogs/CustomerOrderDuplicateDialog';
import { useTranslation } from 'react-i18next';
import { CustomerOrderDeleteDialog } from './dialogs/CustomerOrderDeleteDialog';
import { CustomerOrderDownloadDialog } from './dialogs/CustomerOrderDownloadDialog';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { useCustomerOrderColumns } from './columns';
import { useCustomerOrderManager } from './hooks/useCustomerOrderManager';
import { DuplicateCustomerOrderDto, CustomerOrder } from '@/types';
import { CustomerOrderInvoiceDialog } from './dialogs/CustomerOrderInvoiceDialog';
import ContentSection from '@/components/shared/ContentSection';
import { cn } from '@/lib/utils';
import { BreadcrumbRoute, useBreadcrumb } from '@/context/BreadcrumbContext';

interface CustomerOrderEmbeddedPortalProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const CustomerOrderEmbeddedPortal: React.FC<CustomerOrderEmbeddedPortalProps> = ({
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
      setRoutes?.([...routes, { title: tInvoicing('customerOrder.plural') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const customerOrderManager = useCustomerOrderManager();

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
    data: customerOrdersResp,
    refetch: refetchCustomerOrders
  } = useQuery({
    queryKey: [
      'customerOrders',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.customerOrder.findPaginated(
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

  const customerOrders = React.useMemo(() => {
    return customerOrdersResp?.data || [];
  }, [customerOrdersResp]);

  const context: DataTableConfig<CustomerOrder> = {
    singularName: tInvoicing('customerOrder.singular'),
    pluralName: tInvoicing('customerOrder.plural'),
    //dialogs
    deleteCallback: () => setDeleteDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: customerOrdersResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  const columns = useCustomerOrderColumns(context, firmId, interlocutorId);

  //Remove CustomerOrder
  const { mutate: removeCustomerOrder, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.customerOrder.remove(id),
    onSuccess: () => {
      if (customerOrders?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('customerOrder.action_remove_success'));
      refetchCustomerOrders();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_remove_failure'))
      );
    }
  });

  //Duplicate CustomerOrder
  const { mutate: duplicateCustomerOrder, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateCustomerOrderDto: DuplicateCustomerOrderDto) =>
      api.customerOrder.duplicate(duplicateCustomerOrderDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('customerOrder.action_duplicate_success'));
      await router.push('/selling/customer-order/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_duplicate_failure'))
      );
    }
  });

  //Download CustomerOrder
  const { mutate: downloadCustomerOrder, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.customerOrder.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('customerOrder.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('customerOrder.action_download_failure'))
      );
    }
  });

  //Invoice customerOrder
  const { mutate: invoiceCustomerOrder, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.customerOrder.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success(tInvoicing('customerOrder.action_invoice_success'));
      refetchCustomerOrders();
      router.push(`/selling/invoice/${data.invoices[data?.invoices?.length - 1].id}`);
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        tInvoicing('customerOrder.action_invoice_failure')
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
      title={tInvoicing('customerOrder.plural')}
      desc={tInvoicing('customerOrder.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}
    >
      <>
        <CustomerOrderDeleteDialog
          id={customerOrderManager?.id}
          sequential={customerOrderManager?.sequential || ''}
          open={deleteDialog}
          deleteCustomerOrder={() => {
            customerOrderManager?.id && removeCustomerOrder(customerOrderManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
        <CustomerOrderDuplicateDialog
          id={customerOrderManager?.id || 0}
          sequential={customerOrderManager?.sequential || ''}
          open={duplicateDialog}
          duplicateCustomerOrder={(includeFiles: boolean) => {
            customerOrderManager?.id &&
              duplicateCustomerOrder({
                id: customerOrderManager?.id,
                includeFiles: includeFiles
              });
          }}
          isDuplicationPending={isDuplicationPending}
          onClose={() => setDuplicateDialog(false)}
        />
        <CustomerOrderDownloadDialog
          id={customerOrderManager?.id || 0}
          open={downloadDialog}
          downloadCustomerOrder={(template: string) => {
            customerOrderManager?.id &&
              downloadCustomerOrder({ id: customerOrderManager?.id, template });
          }}
          isDownloadPending={isDownloadPending}
          onClose={() => setDownloadDialog(false)}
        />
        <CustomerOrderInvoiceDialog
          id={customerOrderManager?.id || 0}
          status={customerOrderManager?.status}
          sequential={customerOrderManager?.sequential}
          open={invoiceDialog}
          isInvoicePending={isInvoicingPending}
          invoice={(id: number, createInvoice: boolean) => {
            invoiceCustomerOrder({ id, createInvoice });
          }}
          onClose={() => setInvoiceDialog(false)}
        />
        <DataTable
          context={context}
          className="flex flex-col flex-1 overflow-hidden p-1"
          containerClassName="overflow-auto"
          data={customerOrders}
          columns={columns}
          isPending={isPending}
        />
      </>
    </ContentSection>
  );
};

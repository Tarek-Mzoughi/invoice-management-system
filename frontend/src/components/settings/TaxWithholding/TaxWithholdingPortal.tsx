import React from 'react';
import { api } from '@/api';
import { Tax, TaxWithholding } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useTranslation } from 'react-i18next';
import { useTaxWithholdingManager } from './hooks/useTaxWithholdingManager';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { TaxWithholdingCreateDialog } from './dialogs/TaxWithholdingCreateDialog';
import { TaxWithholdingUpdateDialog } from './dialogs/TaxWithholdingUpdateDialog';
import { TaxWithholdingDeleteDialog } from './dialogs/TaxWithholdingDeleteDialog';
import { getTaxWithholdingColumns } from './data-table/columns';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaxWithholdingPortalProps {
  className?: string;
}

const TaxWithholdingPortal: React.FC<TaxWithholdingPortalProps> = ({ className }) => {
  //next-router
  const router = useRouter();
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('withholding.singular') }
    ]);
  }, [router.locale, tCommon, tSettings, setRoutes]);

  const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();

  const taxWithholdingManager = useTaxWithholdingManager();

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

  const [createDialog, setCreateDialog] = React.useState(false);
  const [updateDialog, setUpdateDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: taxWithholdingsResp,
    refetch: refetchTaxWithholdings
  } = useQuery({
    queryKey: [
      'tax-withholdings',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.taxWithholding.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm
      )
  });

  React.useEffect(() => {
    return () => {
      clearIntro?.();
      clearFloating?.();
    };
  }, [clearIntro, clearFloating]);

  const taxWithholdings = React.useMemo(() => {
    return taxWithholdingsResp?.data || [];
  }, [taxWithholdingsResp]);

  const context: DataTableConfig<Tax> = {
    singularName: tSettings('withholding.singular'),
    pluralName: tSettings('withholding.plural'),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: taxWithholdingsResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey }),
    //actions
    updateCallback: (tax: Tax) => {
      taxWithholdingManager.setTax(tax);
      setUpdateDialog(true);
    },
    deleteCallback: (tax: Tax) => {
      taxWithholdingManager.setTax(tax);
      setDeleteDialog(true);
    }
  };

  //create tax withholding
  const { mutate: createTaxWithholding, isPending: isCreatePending } = useMutation({
    mutationFn: (data: Tax) => api.taxWithholding.create(data),
    onSuccess: () => {
      toast.success(tSettings('withholding.messages.create_success'));
      refetchTaxWithholdings();
      setCreateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('', error, tSettings('withholding.messages.create_error'))
      );
    }
  });

  //update tax withholding
  const { mutate: updateTaxWithholding, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: Tax) => api.taxWithholding.update(data),
    onSuccess: () => {
      toast.success(tSettings('withholding.messages.update_success'));
      refetchTaxWithholdings();
      setUpdateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('', error, tSettings('withholding.messages.update_error'))
      );
    }
  });

  //remove tax withholding
  const { mutate: removeTaxWithholding, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.taxWithholding.remove(id),
    onSuccess: () => {
      if (taxWithholdings?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tSettings('withholding.messages.delete_success'));
      refetchTaxWithholdings();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('', error, tSettings('withholding.messages.delete_error'))
      );
    }
  });

  const handleTaxWithholdingSubmit = (
    taxWithholding: Partial<TaxWithholding>,
    callback: (taxWithholding: any) => void
  ): boolean => {
    const validation = api.taxWithholding.validate(taxWithholding as any);
    if (validation.message) {
      toast.error(validation.message);
      return false;
    } else {
      callback(taxWithholding);
      taxWithholdingManager.reset();
      return true;
    }
  };

  const isPending =
    isFetchPending ||
    isCreatePending ||
    isUpdatePending ||
    isDeletePending ||
    paging ||
    resizing ||
    searching ||
    sorting;

  if (error) return 'An error has occurred: ' + error.message;

  return (
    <>
      <TaxWithholdingCreateDialog
        open={createDialog}
        isCreatePending={isCreatePending}
        createTaxWithholding={() => {
          handleTaxWithholdingSubmit(
            taxWithholdingManager.getTax(),
            createTaxWithholding
          );
        }}
        onClose={() => {
          setCreateDialog(false);
          taxWithholdingManager.reset();
        }}
      />
      <TaxWithholdingUpdateDialog
        open={updateDialog}
        updateTaxWithholding={() => {
          handleTaxWithholdingSubmit(
            taxWithholdingManager.getTax(),
            updateTaxWithholding
          );
        }}
        isUpdatePending={isUpdatePending}
        onClose={() => {
          setUpdateDialog(false);
          taxWithholdingManager.reset();
        }}
      />
      <TaxWithholdingDeleteDialog
        open={deleteDialog}
        deleteTaxWithholding={() => {
          taxWithholdingManager?.id && removeTaxWithholding(taxWithholdingManager?.id);
        }}
        isDeletionPending={isDeletePending}
        label={taxWithholdingManager?.label}
        onClose={() => {
          setDeleteDialog(false);
        }}
      />
      <div className={cn('flex flex-1 flex-col overflow-auto px-4 py-5 lg:px-8 lg:py-6', className)}>
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
          <div className="flex flex-wrap items-start gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg px-4 text-sm font-medium transition-all"
              onClick={() => router.push('/settings')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon('commands.back')}
            </Button>
          </div>

          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
              {tSettings('withholding.singular')}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {tSettings('withholding.card_description')}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold">{tSettings('withholding.singular')}</h2>
              <Button
                className="h-9 rounded-md px-4 font-medium"
                onClick={() => setCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tSettings('withholding.add_button_label')}
              </Button>
            </div>
            <DataTable
              className="flex flex-col flex-1 overflow-hidden"
              containerClassName="overflow-auto"
              data={taxWithholdings}
              columns={getTaxWithholdingColumns(tSettings)}
              context={context}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TaxWithholdingPortal;

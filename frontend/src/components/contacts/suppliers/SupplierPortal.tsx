import React from 'react';
import { Plus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import type { Firm } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { FirmDeleteDialog } from '@/components/contacts/shared/FirmDeleteDialog';
import { FirmListLayout } from '@/components/contacts/shared/FirmListLayout';
import { SUPPLIER_FIRM_MODULE_CONFIG } from '@/components/contacts/shared/firm-navigation';
import { useFirmList } from '@/components/contacts/shared/useFirmList';
import { SupplierTable } from './SupplierTable';
import { SupplierToolbar } from './SupplierToolbar';
import { useGuardedNavigation } from '@/features/rbac/useGuardedNavigation';

interface SupplierPortalProps {
  className?: string;
}

export function SupplierPortal({ className }: SupplierPortalProps) {
  const router = useRouter();
  const guardedNavigation = useGuardedNavigation();
  const { t: tContacts, ready: contactReady } = useTranslation('contacts');
  const { ready: commonReady } = useTranslation('common');
  const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();
  const { setRoutes, clearRoutes } = useBreadcrumb();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [managedFirm, setManagedFirm] = React.useState<Firm | undefined>();
  const list = useFirmList(SUPPLIER_FIRM_MODULE_CONFIG.entityType);
  const prefix = 'firm.modules.suppliers';

  React.useEffect(() => {
    setIntro?.(tContacts(`${prefix}.title`), tContacts(`${prefix}.description`));
    setRoutes?.([{ title: tContacts(`${prefix}.title`) }]);
    setFloating?.(
      <Button
        className="h-11 rounded-md px-5"
        onClick={() => guardedNavigation.push(SUPPLIER_FIRM_MODULE_CONFIG.newPath)}
      >
        <Plus className="h-4 w-4" />
        {tContacts(`${prefix}.add`)}
      </Button>
    );

    return () => {
      clearIntro?.();
      clearRoutes?.();
      clearFloating?.();
    };
  }, [clearFloating, clearIntro, clearRoutes, guardedNavigation, router.locale, setFloating, setIntro, setRoutes, tContacts]);

  const { mutate: removeFirm, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.firm.remove(id),
    onSuccess: () => {
      if (list.firms.length === 1 && list.page > 1) {
        list.setPage(list.page - 1);
      }
      toast.success(tContacts(`${prefix}.delete_success`));
      list.query.refetch();
      setDeleteDialogOpen(false);
      setManagedFirm(undefined);
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('contacts', mutationError, tContacts(`${prefix}.delete_error`)));
    }
  });

  const isPending =
    list.isFetchPending ||
    isDeletePending ||
    list.searching ||
    list.filtering ||
    !contactReady ||
    !commonReady;

  if (list.query.error) {
    return 'An error has occurred: ' + (list.query.error instanceof Error ? list.query.error.message : '');
  }

  return (
    <>
      <FirmDeleteDialog
        config={SUPPLIER_FIRM_MODULE_CONFIG}
        firmName={managedFirm?.name}
        loading={isDeletePending}
        onClose={() => {
          setDeleteDialogOpen(false);
          setManagedFirm(undefined);
        }}
        onConfirm={() => managedFirm?.id && removeFirm(managedFirm.id)}
        open={deleteDialogOpen}
      />
      <FirmListLayout
        className={className}
        toolbar={
          <SupplierToolbar
            hasActiveFilters={list.hasActiveFilters}
            onReset={() => {
              list.setPage(1);
              list.setSearchTerm('');
              list.setTypeFilter('all');
            }}
            onSearchChange={(value) => {
              list.setPage(1);
              list.setSearchTerm(value);
            }}
            onTypeFilterChange={(value) => {
              list.setPage(1);
              list.setTypeFilter(value);
            }}
            searchTerm={list.searchTerm}
            typeFilter={list.typeFilter}
          />
        }
        table={
          <SupplierTable
            disabled={isPending}
            emptyLabel={tContacts(`${prefix}.empty`)}
            firms={list.firms}
            isPending={isPending}
            onDeleteRequest={(firm) => {
              setManagedFirm(firm);
              setDeleteDialogOpen(true);
            }}
            onPageChange={list.setPage}
            onPageSizeChange={(value) => {
              list.setPage(1);
              list.setSize(value);
            }}
            page={list.page}
            size={list.size}
            totalPageCount={list.totalPageCount}
            totalResultCount={list.totalResultCount}
          />
        }
      />
    </>
  );
}

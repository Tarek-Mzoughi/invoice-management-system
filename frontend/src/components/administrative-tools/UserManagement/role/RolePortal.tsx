import { api } from '@/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { getRoleColumns } from './data-table/columns';
import { useRoleCreateSheet } from './modals/RoleCreateSheet';
import { useRoleManager } from './hooks/useRoleManager';
import { useRoleUpdateSheet } from './modals/RoleUpdateSheet';
import { useRoleDeleteDialog } from './modals/RoleDeleteDialog';
import { useRoleDuplicateDialog } from './modals/RoleDuplicateDialog';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { CreateRoleDto, UpdateRoleDto, Role } from '@/types';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus } from 'lucide-react';
import { RoleActionsContext } from './data-table/action-context';
import { Button } from '@/components/ui/button';

interface RolePortalProps {
  className?: string;
}

export default function RolePortal({ className }: RolePortalProps) {
  //next-router
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { t: tPermission } = useTranslation('permissions');

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('roles.singular') }
    ]);
  }, [router.locale, tCommon, tSettings, setRoutes]);

  const { clearIntro, clearFloating } = useIntro();

  const roleManager = useRoleManager();
  const [page, setPage] = React.useState(1);
  const { value: debouncedPage, loading: paging } = useDebounce<number>(page, 500);

  const [size, setSize] = React.useState(5);
  const { value: debouncedSize, loading: resizing } = useDebounce<number>(size, 500);

  const [sortDetails, setSortDetails] = React.useState({
    order: true,
    sortKey: 'id'
  });
  const { value: debouncedSortDetails, loading: sorting } = useDebounce<typeof sortDetails>(
    sortDetails,
    500
  );

  const [searchTerm, setSearchTerm] = React.useState('');
  const { value: debouncedSearchTerm, loading: searching } = useDebounce<string>(searchTerm, 500);

  const {
    data: rolesResponse,
    isFetching: isRolesPending,
    refetch: refetchRoles
  } = useQuery({
    queryKey: [
      'roles',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.role.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm
      )
  });

  const roles = React.useMemo(() => {
    if (!rolesResponse) return [];
    return rolesResponse.data;
  }, [rolesResponse]);

  const { mutate: createRole, isPending: isCreationPending } = useMutation({
    mutationFn: (role: CreateRoleDto) => api.role.create(role),
    onSuccess: () => {
      toast('Role Created Successfully');
      refetchRoles();
      roleManager.reset();
      closeCreateRoleSheet();
    },
    onError: (error) => {
      toast(error.message);
    }
  });

  const { mutate: updateRole, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: { id?: string; role?: UpdateRoleDto }) =>
      api.role.update(data.id, data.role),
    onSuccess: () => {
      toast('Role Updated Successfully');
      refetchRoles();
      roleManager.reset();
      closeUpdateRoleSheet();
    },
    onError: (error) => {
      toast(error.message);
    }
  });

  const { mutate: deleteRole, isPending: isDeletionPending } = useMutation({
    mutationFn: (id?: string) => api.role.remove(id),
    onSuccess: () => {
      toast('Role Deleted Successfully');
      refetchRoles();
      roleManager.reset();
      closeDeleteRoleDialog();
    },
    onError: (error) => {
      toast(error.message);
    }
  });

  const { mutate: duplicateRole, isPending: isDuplicationPending } = useMutation({
    mutationFn: (id?: string) => api.role.duplicate(id),
    onSuccess: () => {
      toast('Role Duplicated Successfully');
      refetchRoles();
      roleManager.reset();
      closeDuplicateRoleDialog();
    },
    onError: (error) => {
      toast(error.message);
    }
  });

  const handleCreateSubmit = () => {
    const { permissions, ...data } = roleManager.getRole();
    createRole({
      ...data,
      permissions: roleManager?.permissions?.map((permission) => ({
        permissionId: permission.id
      }))
    });
  };

  const handleUpdateSubmit = () => {
    const { permissions, ...data } = roleManager.getRole();
    updateRole({
        id: data.id,
        role: {
          label: data.label,
          description: data.description,
          permissions: roleManager?.permissions?.map((permission) => ({
            permissionId: permission.id
          }))
        }
      });
  };

  const { createRoleSheet, openCreateRoleSheet, closeCreateRoleSheet } = useRoleCreateSheet({
    createRole: handleCreateSubmit,
    isCreatePending: isCreationPending,
    resetRole: () => roleManager.reset()
  });

  const { updateRoleSheet, openUpdateRoleSheet, closeUpdateRoleSheet } = useRoleUpdateSheet({
    updateRole: handleUpdateSubmit,
    isUpdatePending: isUpdatePending,
    resetRole: () => roleManager.reset()
  });

  const { deleteRoleDialog, openDeleteRoleDialog, closeDeleteRoleDialog } = useRoleDeleteDialog({
    roleLabel: roleManager.label,
    deleteRole: () => deleteRole(roleManager?.id),
    isDeletionPending,
    resetRole: () => roleManager.reset()
  });

  const { duplicateRoleDialog, openDuplicateRoleDialog, closeDuplicateRoleDialog } =
    useRoleDuplicateDialog({
      roleLabel: roleManager.label,
      duplicateRole: () => duplicateRole(roleManager?.id),
      isDuplicationPending,
      resetRole: () => roleManager.reset()
    });

  React.useEffect(() => {
    return () => {
      clearIntro?.();
      clearFloating?.();
    };
  }, [clearIntro, clearFloating]);

  const context: DataTableConfig<Role> = {
    singularName: tSettings('roles.singular'),
    pluralName: tSettings('roles.plural'),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: rolesResponse?.meta.pageCount || 0,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey }),
    //actions
    updateCallback: (role: Role) => {
      roleManager.setRole(role);
      openUpdateRoleSheet();
    },
    deleteCallback: (role: Role) => {
      roleManager.setRole(role);
      openDeleteRoleDialog();
    }
  };

  const isPending = isRolesPending || paging || resizing || searching || sorting;

  return (
    <RoleActionsContext.Provider value={context as any}>
      {createRoleSheet}
      {updateRoleSheet}
      {deleteRoleDialog}
      {duplicateRoleDialog}
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
              {tSettings('roles.singular')}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {tSettings('roles.description')}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold">{tSettings('roles.singular')}</h2>
              <Button
                className="h-9 rounded-md px-4 font-medium"
                onClick={() => openCreateRoleSheet()}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tSettings('roles.add_button_label')}
              </Button>
            </div>
            <DataTable
              className="flex flex-col flex-1 overflow-hidden"
              containerClassName="overflow-auto"
              columns={getRoleColumns(tSettings, tPermission)}
              data={roles}
              context={context}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
    </RoleActionsContext.Provider>
  );
}

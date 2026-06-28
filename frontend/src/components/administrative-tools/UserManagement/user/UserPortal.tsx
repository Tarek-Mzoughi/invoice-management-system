import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Trash2,
  UserRound
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { cn } from '@/lib/utils';
import { ResponseUserDto as User } from '@/types';
import { getErrorMessage } from '@/utils/errors';

interface UserPortalProps {
  className?: string;
}

const panelClassName =
  'rounded-md border border-border bg-card shadow-sm';

const badgeClassNames = {
  admin:
    'border border-primary bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground',
  collaborator:
    'border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground',
  custom:
    'border border-accent bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground'
};

const ADMIN_ROLE_LABELS = ['admin', 'owner', 'proprietaire', 'propriétaire'];
const COLLABORATOR_ROLE_LABELS = ['standard-user', 'collaborator', 'collaborateur'];

const getRolePresentation = (user: User, tSettings: ReturnType<typeof useTranslation>['t']) => {
  const roleType = user.roleType;
  const roleLabel = (user.role?.label || '').trim().toLowerCase();

  if (roleType === 'ADMIN') {
    return {
      label: tSettings('users.roles.admin'),
      className: badgeClassNames.admin
    };
  }

  if (roleType === 'COLLABORATOR') {
    return {
      label: tSettings('users.roles.collaborator'),
      className: badgeClassNames.collaborator
    };
  }

  if (roleType === 'CUSTOM') {
    return {
      label: tSettings('users.roles.custom'),
      className: badgeClassNames.custom
    };
  }

  if (ADMIN_ROLE_LABELS.includes(roleLabel)) {
    return {
      label: tSettings('users.roles.admin'),
      className: badgeClassNames.admin
    };
  }

  if (COLLABORATOR_ROLE_LABELS.includes(roleLabel)) {
    return {
      label: tSettings('users.roles.collaborator'),
      className: badgeClassNames.collaborator
    };
  }

  return {
    label: tSettings('users.roles.custom'),
    className: badgeClassNames.custom
  };
};

const getEnterprisePresentation = (user: User) => {
  const cabinets = user.cabinets?.length
    ? user.cabinets
    : user.currentCabinet
      ? [user.currentCabinet]
      : [];
  const names = Array.from(
    new Set(
      cabinets
        .map((cabinet) => cabinet.enterpriseName?.trim() || (cabinet.id ? `#${cabinet.id}` : ''))
        .filter(Boolean)
    )
  );
  const cabinetCount = user.cabinetCount ?? names.length;

  if (names.length === 0) return cabinetCount > 0 ? String(cabinetCount) : '-';
  if (cabinetCount > 1) return `${names[0]} +${cabinetCount - 1}`;
  return names[0];
};

export default function UserPortal({ className }: UserPortalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes } = useBreadcrumb();
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(20);
  const canCreateUsers = true;
  const canUpdateUsers = true;
  const canDeleteUsers = true;

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('home.sections.admin_tools') },
      { title: tSettings('user_management.singular') }
    ]);
  }, [router.locale]);

  const {
    data: usersResponse,
    isFetching: isUsersPending,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['users', page, size],
    queryFn: () => api.user.findPaginated(page, size, 'DESC', 'createdAt', '')
  });

  const users = usersResponse?.data || [];
  const totalPageCount = usersResponse?.meta.pageCount || 0;
  const totalResultCount = usersResponse?.meta.itemCount || 0;
  const startResult = totalResultCount === 0 ? 0 : (page - 1) * size + 1;
  const endResult = totalResultCount === 0 ? 0 : Math.min(page * size, totalResultCount);

  const { mutate: activateUser, isPending: isActivationPending } = useMutation({
    mutationFn: (id?: string) => api.user.activate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(tSettings('users.messages.activate_success'));
      refetchUsers();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('settings', error, tSettings('users.messages.activate_error'))
      );
    }
  });

  const { mutate: deactivateUser, isPending: isDeactivationPending } = useMutation({
    mutationFn: (id?: string) => api.user.deactivate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(tSettings('users.messages.deactivate_success'));
      refetchUsers();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('settings', error, tSettings('users.messages.deactivate_error'))
      );
    }
  });

  const { mutate: deleteUser, isPending: isDeletionPending } = useMutation({
    mutationFn: (id?: string) => api.user.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(tSettings('users.messages.delete_success'));
      refetchUsers();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('settings', error, tSettings('users.messages.delete_error'))
      );
    }
  });

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <div className="flex flex-col gap-6 pb-8">
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-sm px-4"
            onClick={() => router.push('/settings')}>
            <ArrowLeft className="h-4 w-4" />
            {tCommon('commands.back')}
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {tSettings('user_management.singular')}
            </h1>
            <p className="text-base text-muted-foreground">
              {tSettings('users.portal_description')}
            </p>
          </div>

          {canCreateUsers ? (
            <Button
              type="button"
              className="h-10 rounded-sm px-4"
              onClick={() => router.push('/settings/admin/users/new')}>
              <Plus className="h-4 w-4" />
              {tSettings('users.actions.add_user')}
            </Button>
          ) : null}
        </div>

        <div className={panelClassName}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-border bg-muted/60">
                <tr className="text-left text-sm font-medium text-muted-foreground">
                  <th className="px-3 py-3">{tSettings('users.list.columns.name')}</th>
                  <th className="px-3 py-3">{tSettings('users.list.columns.role')}</th>
                  <th className="px-3 py-3">{tSettings('users.list.columns.phone')}</th>
                  <th className="px-3 py-3">{tSettings('users.list.columns.enterprises')}</th>
                  <th className="px-3 py-3 text-right">
                    {tSettings('users.list.columns.actions')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.length > 0 ? (
                  users.map((user) => {
                    const rolePresentation = getRolePresentation(user, tSettings);
                    const enterprisePresentation = getEnterprisePresentation(user);
                    const fullName =
                      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '-';

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-b-0">
                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {fullName}
                              </p>
                              {user.isCabinetPrincipalAdmin ? (
                                <Badge
                                  variant="outline"
                                  className="border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  {tSettings('users.roles.principal_admin')}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {user.email || '-'}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <Badge variant="outline" className={rolePresentation.className}>
                            {rolePresentation.label}
                          </Badge>
                        </td>

                        <td className="px-3 py-3 align-top text-sm text-foreground">
                          {user.profile?.phone || '-'}
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="max-w-[220px] truncate" title={enterprisePresentation}>
                              {enterprisePresentation}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 rounded-sm p-0 text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {canUpdateUsers ? (
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/settings/admin/users/${user.id}`)}>
                                    <Pencil className="h-4 w-4" />
                                    {tCommon('commands.modify')}
                                  </DropdownMenuItem>
                                ) : null}
                                {canUpdateUsers ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      user.isActive
                                        ? deactivateUser(user.id)
                                        : activateUser(user.id)
                                    }
                                    disabled={
                                      isActivationPending ||
                                      isDeactivationPending ||
                                      user.isCabinetPrincipalAdmin
                                    }>
                                    <Power className="h-4 w-4" />
                                    {user.isActive
                                      ? tCommon('commands.deactivate')
                                      : tCommon('commands.activate')}
                                  </DropdownMenuItem>
                                ) : null}
                                {canDeleteUsers ? (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deleteUser(user.id)}
                                    disabled={isDeletionPending || user.isCabinetPrincipalAdmin}>
                                    <Trash2 className="h-4 w-4" />
                                    {tCommon('commands.delete')}
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="h-[360px] px-4 py-6 text-center text-base text-muted-foreground">
                      {isUsersPending ? (
                        <Spinner size="medium" show />
                      ) : (
                        tSettings('users.list.empty')
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-sm text-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span>{tCommon('pagination.rows_per')}</span>
              <Select
                value={String(size)}
                onValueChange={(value) => {
                  setPage(1);
                  setSize(Number(value));
                }}>
                <SelectTrigger className="h-10 w-20 rounded-sm">
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
            </div>

            <span>
              {tCommon('pagination.enumerate', {
                page: Math.min(page, totalPageCount || 1),
                totalPageCount: Math.max(totalPageCount, 1)
              })}
            </span>

            <span className="text-muted-foreground">
              {tSettings('users.list.range', {
                start: startResult,
                end: endResult,
                total: totalResultCount
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 rounded-sm p-0"
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 rounded-sm p-0"
              disabled={page >= totalPageCount}
              onClick={() =>
                setPage((currentPage) => Math.min(currentPage + 1, totalPageCount || 1))
              }>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

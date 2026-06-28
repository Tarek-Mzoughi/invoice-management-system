import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { PriceListFormDialog } from '@/components/price-lists/PriceListFormDialog';
import { Spinner } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useDebounce } from '@/hooks/other/useDebounce';
import { cn } from '@/lib/utils';
import { PriceList } from '@/types';
import { getErrorMessage } from '@/utils/errors';

interface PriceListPortalProps {
  className?: string;
}

export const PriceListPortal = ({ className }: PriceListPortalProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes } = useBreadcrumb();

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('price_lists.title') }
    ]);
  }, [router.locale, setRoutes, tCommon, tSettings]);

  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(20);
  const { value: debouncedPage, loading: paging } = useDebounce(page, 250);
  const { value: debouncedSize, loading: resizing } = useDebounce(size, 250);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingPriceList, setEditingPriceList] = React.useState<PriceList | undefined>();
  const [deletingPriceList, setDeletingPriceList] = React.useState<PriceList | undefined>();

  const {
    data: priceListsResp,
    error,
    isPending: isFetchPending,
    refetch
  } = useQuery({
    queryKey: ['price-lists', debouncedPage, debouncedSize],
    queryFn: () =>
      api.priceList.findPaginated({
        page: debouncedPage,
        limit: debouncedSize,
        sort: 'name,ASC',
        filter: ''
      })
  });

  const priceLists = priceListsResp?.data || [];
  const pageCount = priceListsResp?.meta.pageCount || 1;
  const total = priceListsResp?.meta.itemCount || 0;
  const firstRow = total === 0 ? 0 : (page - 1) * size + 1;
  const lastRow = Math.min(page * size, total);

  const invalidatePriceLists = async () => {
    await queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    await refetch();
  };

  const { mutate: createPriceList, isPending: isCreatePending } = useMutation({
    mutationFn: (data: PriceList) => api.priceList.create(data),
    onSuccess: async () => {
      toast.success(tSettings('price_lists.messages.create_success'));
      setCreateDialogOpen(false);
      await invalidatePriceLists();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('settings', mutationError, tSettings('price_lists.messages.create_error')));
    }
  });

  const { mutate: updatePriceList, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: PriceList) => api.priceList.update(data),
    onSuccess: async () => {
      toast.success(tSettings('price_lists.messages.update_success'));
      setEditingPriceList(undefined);
      await invalidatePriceLists();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('settings', mutationError, tSettings('price_lists.messages.update_error')));
    }
  });

  const { mutate: deletePriceList, isPending: isDeletePending } = useMutation({
    mutationFn: (id?: number) => api.priceList.remove(id),
    onSuccess: async () => {
      if (priceLists.length === 1 && page > 1) setPage(page - 1);
      toast.success(tSettings('price_lists.messages.delete_success'));
      setDeletingPriceList(undefined);
      await invalidatePriceLists();
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('settings', mutationError, tSettings('price_lists.messages.delete_error')));
    }
  });

  const handleSubmit = (payload: PriceList, callback: (payload: PriceList) => void) => {
    const validation = api.priceList.validate(payload);
    if (validation.message) {
      toast.error(tSettings(validation.message.replace('settings:', '')));
      return;
    }
    callback(payload);
  };

  const isPending =
    isFetchPending || isCreatePending || isUpdatePending || isDeletePending || paging || resizing;

  if (error) {
    return tSettings('price_lists.messages.load_error');
  }

  return (
    <div className={cn('flex flex-1 flex-col overflow-auto px-4 py-5 lg:px-8 lg:py-6', className)}>
      <PriceListFormDialog
        open={createDialogOpen}
        pending={isCreatePending}
        title={tSettings('price_lists.dialogs.create_title')}
        description={tSettings('price_lists.dialogs.create_description')}
        submitLabel={tCommon('commands.create')}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={(payload) => handleSubmit(payload, createPriceList)}
      />

      <PriceListFormDialog
        open={Boolean(editingPriceList)}
        pending={isUpdatePending}
        initialValue={editingPriceList}
        title={tSettings('price_lists.dialogs.update_title')}
        description={tSettings('price_lists.dialogs.update_description')}
        submitLabel={tCommon('commands.save')}
        onClose={() => setEditingPriceList(undefined)}
        onSubmit={(payload) =>
          handleSubmit({ ...editingPriceList, ...payload }, updatePriceList)
        }
      />

      <Dialog open={Boolean(deletingPriceList)} onOpenChange={(nextOpen) => !nextOpen && setDeletingPriceList(undefined)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{tSettings('price_lists.dialogs.delete_title')}</DialogTitle>
            <DialogDescription>
              {tSettings('price_lists.dialogs.delete_description', {
                name: deletingPriceList?.name || ''
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isDeletePending} onClick={() => setDeletingPriceList(undefined)}>
              {tCommon('commands.cancel')}
            </Button>
            <Button variant="destructive" disabled={isDeletePending} onClick={() => deletePriceList(deletingPriceList?.id)}>
              {tCommon('commands.delete')}
              <Spinner className="ml-2" size="small" show={isDeletePending} />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <div className="flex flex-wrap items-start gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg px-4 text-sm font-medium transition-all"
            onClick={() => router.push('/settings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon('commands.back')}
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
              {tSettings('price_lists.title')}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {tSettings('price_lists.description')}
            </p>
          </div>
          <Button className="h-10 rounded-md bg-amber-500 px-5 font-semibold text-zinc-950 shadow-sm hover:bg-amber-400" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {tSettings('price_lists.actions.add')}
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tSettings('price_lists.table.name')}</TableHead>
                <TableHead>{tSettings('price_lists.table.status')}</TableHead>
                <TableHead className="text-right">{tSettings('price_lists.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-28 text-center">
                    <div className="flex items-center justify-center gap-2 font-medium">
                      {tCommon('table.loading')}
                      <Spinner />
                    </div>
                  </TableCell>
                </TableRow>
              ) : priceLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-28 text-center text-muted-foreground">
                    {tSettings('price_lists.table.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                priceLists.map((priceList) => (
                  <TableRow key={priceList.id}>
                    <TableCell className="h-12 font-medium">{priceList.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            priceList.active
                              ? 'border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                              : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-100'
                          )}>
                          {priceList.active ? tSettings('price_lists.status.active') : tSettings('price_lists.status.inactive')}
                        </Badge>
                        <Switch
                          checked={priceList.active ?? false}
                          disabled={isUpdatePending}
                          onCheckedChange={(checked) =>
                            updatePriceList({ ...priceList, active: checked })
                          }
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingPriceList(priceList)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {tCommon('commands.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeletingPriceList(priceList)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tCommon('commands.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span>{tSettings('price_lists.pagination.rows')}</span>
            <Select
              value={String(size)}
              onValueChange={(value) => {
                setPage(1);
                setSize(Number(value));
              }}>
              <SelectTrigger className="h-9 w-[70px]">
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

          <span className="text-foreground">
            {tSettings('price_lists.pagination.page', { page, pageCount })}
          </span>
          <span>
            {tSettings('price_lists.pagination.summary', { first: firstRow, last: lastRow, total })}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

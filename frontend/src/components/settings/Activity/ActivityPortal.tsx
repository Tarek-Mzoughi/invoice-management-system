import React from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useDebounce } from '@/hooks/other/useDebounce';
import { ActivityDeleteDialog } from './dialogs/ActivityDeleteDialog';
import { useTranslation } from 'react-i18next';
import { ActivityUpdateDialog } from './dialogs/ActivityUpdateDialog';
import { useActivityManager } from './hooks/useActivityManager';
import { ActivityCreateDialog } from './dialogs/ActivityCreateDialog';
import { Activity } from '@/types';
import { DataTable } from '@/components/shared/data-table/data-table';
import { DataTableConfig } from '@/components/shared/data-table/types';
import { ActivityActionsContext } from './data-table/ActionDialogContext';
import { getActivityColumns } from './data-table/columns';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useIntro } from '@/context/IntroContext';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityPortalProps {
  className?: string;
}

const ActivityPortal: React.FC<ActivityPortalProps> = ({ className }) => {
  //next-router
  const router = useRouter();
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('activity.plural') }
    ]);
  }, [router.locale, tSettings, setRoutes, tCommon]);

  const { setIntro, clearIntro, setFloating, clearFloating } = useIntro();

  const activityManager = useActivityManager();

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
    data: activitiesResp,
    refetch: refetchActivities
  } = useQuery({
    queryKey: [
      'activities',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.activity.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        'label',
        debouncedSearchTerm
      )
  });

  React.useEffect(() => {
    return () => {
      clearIntro?.();
      clearFloating?.();
    };
  }, [clearIntro, clearFloating]);

  const activities = React.useMemo(() => {
    return activitiesResp?.data || [];
  }, [activitiesResp]);

  const context: DataTableConfig<Activity> = {
    singularName: tSettings('activity.singular'),
    pluralName: tSettings('activity.plural'),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: activitiesResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey }),
    //actions
    updateCallback: (activity: Activity) => {
      activityManager.setActivity(activity);
      setUpdateDialog(true);
    },
    deleteCallback: (activity: Activity) => {
      activityManager.setActivity(activity);
      setDeleteDialog(true);
    }
  };

  const { mutate: createActivity, isPending: isCreatePending } = useMutation({
    mutationFn: (data: Activity) => api.activity.create(data),
    onSuccess: () => {
      toast.success(tSettings('activity.messages.create_success'));
      refetchActivities();
      activityManager.reset();
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tSettings('activity.messages.create_error')));
    }
  });

  const { mutate: updateActivity, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: Activity) => api.activity.update(data),
    onSuccess: () => {
      toast.success(tSettings('activity.messages.update_success'));
      refetchActivities();
      activityManager.reset();
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tSettings('activity.messages.update_error')));
    }
  });

  const { mutate: removeActivity, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.activity.remove(id),
    onSuccess: () => {
      if (activities?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tSettings('activity.messages.delete_success'));
      refetchActivities();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tSettings('activity.messages.delete_error')));
    }
  });

  const handleActivitySubmit = (
    activity: Activity,
    callback: (activity: Activity) => void
  ): boolean => {
    const validation = api.activity.validate(activity);
    if (validation.message) {
      toast.error(validation.message);
      return false;
    } else {
      callback(activity);
      activityManager.reset();
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
    <ActivityActionsContext.Provider value={context as any}>
      <ActivityCreateDialog
        open={createDialog}
        isCreatePending={isCreatePending}
        createActivity={() => {
          handleActivitySubmit(activityManager.getActivity() as Activity, createActivity) &&
            setCreateDialog(false);
        }}
        onClose={() => {
          setCreateDialog(false);
        }}
      />
      <ActivityUpdateDialog
        open={updateDialog}
        updateActivity={() => {
          handleActivitySubmit(activityManager.getActivity() as Activity, updateActivity) &&
            setUpdateDialog(false);
        }}
        isUpdatePending={isUpdatePending}
        onClose={() => {
          setUpdateDialog(false);
        }}
      />
      <ActivityDeleteDialog
        open={deleteDialog}
        deleteActivity={() => {
          activityManager?.id && removeActivity(activityManager?.id);
        }}
        isDeletionPending={isDeletePending}
        label={activityManager?.label}
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
              {tSettings('activity.plural')}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {tSettings('activity.card_description')}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold">{tSettings('activity.plural')}</h2>
              <Button
                className="h-9 rounded-md px-4 font-medium"
                onClick={() => setCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tSettings('activity.add_button_label')}
              </Button>
            </div>
            <DataTable
              className="flex flex-col flex-1 overflow-hidden"
              containerClassName="overflow-auto"
              columns={getActivityColumns(tSettings)}
              data={activities}
              context={context}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
    </ActivityActionsContext.Provider>
  );
};

export default ActivityPortal;

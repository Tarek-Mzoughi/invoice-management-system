import React from 'react';
import { api } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateCabinetPayload } from '@/types';
import { useCurrentUser } from './user/useCurrentUser';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const ACTIVE_CABINET_KEY = 'active-cabinet-id';

// Reactive store for the active cabinet override ID
let _activeCabinetId: number | null =
  typeof window !== 'undefined'
    ? (() => {
        const stored = localStorage.getItem(ACTIVE_CABINET_KEY);
        return stored ? Number(stored) : null;
      })()
    : null;

const _subscribers = new Set<() => void>();

const subscribe = (callback: () => void) => {
  _subscribers.add(callback);
  return () => {
    _subscribers.delete(callback);
  };
};

const getSnapshot = () => _activeCabinetId;
const getServerSnapshot = () => null;

const setActiveCabinetId = (id: number) => {
  _activeCabinetId = id;
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_CABINET_KEY, String(id));
  }
  _subscribers.forEach((fn) => fn());
};

const usePersistedCabinetId = () =>
  React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const useCabinets = () => {
  const { user } = useCurrentUser();
  const cabinets = React.useMemo(() => {
    const list = user?.cabinets ?? [];
    if (list.length) return list;
    if (user?.currentCabinet) return [user.currentCabinet];
    return [];
  }, [user?.cabinets, user?.currentCabinet]);
  return { cabinets, isLoading: !user };
};

export const useActiveCabinet = () => {
  const { user } = useCurrentUser();
  const { cabinets } = useCabinets();
  const persistedId = usePersistedCabinetId();

  const activeCabinet = React.useMemo(() => {
    if (!cabinets.length) return null;

    if (persistedId) {
      const found = cabinets.find((c) => c.id === persistedId);
      if (found) return found;
    }

    const fromUser = user?.currentCabinetId
      ? cabinets.find((c) => c.id === user.currentCabinetId)
      : null;
    if (fromUser) return fromUser;

    if (user?.currentCabinet) return user.currentCabinet;

    return cabinets[0] ?? null;
  }, [cabinets, persistedId, user?.currentCabinetId, user?.currentCabinet]);

  // Auto-sync active-cabinet-id to localStorage when:
  // - No persisted ID exists, or
  // - Persisted ID doesn't match any of the user's cabinets
  React.useEffect(() => {
    if (!activeCabinet?.id) return;

    const isPersistedValid = persistedId && cabinets.some((c) => c.id === persistedId);
    if (!isPersistedValid) {
      setActiveCabinetId(activeCabinet.id);
    }
  }, [activeCabinet?.id, persistedId, cabinets]);

  return { activeCabinet, cabinets };
};

export const useSwitchCabinet = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { cabinets } = useCabinets();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const switchCabinet = React.useCallback(
    async (cabinetId: number) => {
      const exists = cabinets.some((c) => c.id === cabinetId);
      if (!exists) return;

      setIsSwitching(true);
      try {
        const updatedUser = await api.cabinet.switchActiveCabinet(cabinetId);
        setActiveCabinetId(cabinetId);
        queryClient.setQueryData(['current-user'], updatedUser);
        toast.success(t('sidebar.switch_success'));
        window.location.assign('/dashboard');
      } catch {
        toast.error(t('sidebar.switch_error'));
      } finally {
        setIsSwitching(false);
      }
    },
    [cabinets, queryClient, t]
  );

  return { switchCabinet, isSwitching };
};

export const useCreateCabinet = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (payload: CreateCabinetPayload) => api.cabinet.create(payload),
    onSuccess: async (cabinet) => {
      if (cabinet.id) {
        setActiveCabinetId(cabinet.id);
      }
      await queryClient.invalidateQueries();
      toast.success(t('sidebar.create_success'));
      router.push('/dashboard');
    },
    onError: () => {
      toast.error(t('sidebar.create_error'));
    }
  });

  return {
    createCabinet: mutation.mutate,
    isCreating: mutation.isPending
  };
};

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { canAccessRoute, resolveRouteAccess } from './routeAccess';
import { useCurrentPermissions } from './usePermissions';

export const useGuardedNavigation = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { effectivePermissions, isAdmin, isPending } = useCurrentPermissions();

  const push = useCallback(
    (target: string) => {
      const rule = resolveRouteAccess(target);
      if (!rule) return router.push(target);

      const allowed =
        !isPending && canAccessRoute({ effectivePermissions, isAdmin, path: target });

      if (!allowed) {
        toast.error(t(rule.deniedMessageKey), { id: `rbac-navigation-${rule.permission}` });
        return Promise.resolve(false);
      }

      return router.push(target);
    },
    [effectivePermissions, isAdmin, isPending, router, t]
  );

  return useMemo(() => ({ push }), [push]);
};

export const useGuardedRouter = () => {
  const router = useRouter();
  const guardedNavigation = useGuardedNavigation();

  return useMemo(
    () => ({ ...router, push: guardedNavigation.push }),
    [guardedNavigation, router]
  );
};

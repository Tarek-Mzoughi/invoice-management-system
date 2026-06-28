import React from 'react';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Spinner } from './shared/Spinner';
import { Layout } from './layout/Layout';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { useAuthSyncStatus } from '@/hooks/other/useAuthSyncStatus';
import { useCurrentUser } from '@/hooks/content/user/useCurrentUser';
import { AccessDenied } from '@/features/rbac/AccessDenied';
import { PERMISSIONS, hasPermission } from '@/features/rbac/permissions';
import { resolveRouteAccess } from '@/features/rbac/routeAccess';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ApplicationProps {
  className?: string;
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
}

const publicRoutes = ['/auth', '/forgot-password', '/reset-password', '/verify-email'];
const onboardingRoute = '/onboarding/company';
const protectedHome = '/dashboard';

const readableRoutePriority = [
  { permission: PERMISSIONS.dashboard.read, route: '/dashboard' },
  { permission: PERMISSIONS.selling_documents.read, route: '/selling' },
  { permission: PERMISSIONS.buying_documents.read, route: '/buying' },
  { permission: PERMISSIONS.payments.read, route: '/payments' },
  { permission: PERMISSIONS.treasury.read, route: '/treasury/transactions' },
  { permission: PERMISSIONS.clients.read, route: '/clients' },
  { permission: PERMISSIONS.suppliers.read, route: '/suppliers' },
  { permission: PERMISSIONS.products.read, route: '/articles' },
  { permission: PERMISSIONS.enterprise.read, route: '/settings/account/cabinet' },
  { permission: PERMISSIONS.document_settings.read, route: '/settings/pdf/templates' },
  { permission: PERMISSIONS.price_lists.read, route: '/settings/system/price-lists' },
  { permission: PERMISSIONS.taxes.read, route: '/settings/system/tax' }
] as const;

export const resolveDefaultRoute = (permissionIds: string[] | undefined) =>
  readableRoutePriority.find(({ permission }) => hasPermission(permissionIds, permission))?.route ||
  null;

const isReadPermission = (permissionId?: string | null) => permissionId?.startsWith('read-');

const getRoutePermission = (pathname: string): string | null => {
  if (pathname.startsWith('/dashboard')) return PERMISSIONS.dashboard.read;

  // Selling
  if (pathname.startsWith('/selling/new-')) return PERMISSIONS.selling_documents.create;
  if (pathname.includes('/selling/') && pathname.includes('/edit')) {
    return PERMISSIONS.selling_documents.update;
  }
  if (pathname.startsWith('/selling')) return PERMISSIONS.selling_documents.read;

  // Buying
  if (pathname.startsWith('/buying/nouveau') || pathname.startsWith('/buying/nouvel')) {
    return PERMISSIONS.buying_documents.create;
  }
  if (pathname.includes('/buying/') && pathname.includes('/edit')) {
    return PERMISSIONS.buying_documents.update;
  }
  if (pathname.startsWith('/buying')) return PERMISSIONS.buying_documents.read;

  // Payments
  if (pathname.startsWith('/payments/new') || pathname.endsWith('/new-payment')) {
    return PERMISSIONS.payments.create;
  }
  if (pathname.startsWith('/payments') || pathname.includes('/payments')) {
    return PERMISSIONS.payments.read;
  }

  // Articles
  if (pathname.startsWith('/articles/new')) return PERMISSIONS.products.create;
  if (pathname.includes('/articles/') && pathname.includes('/edit')) {
    return PERMISSIONS.products.update;
  }
  if (pathname.startsWith('/articles')) return PERMISSIONS.products.read;

  // Clients
  if (pathname.startsWith('/clients/new')) return PERMISSIONS.clients.create;
  if (pathname.includes('/clients/') && pathname.includes('/edit')) {
    return PERMISSIONS.clients.update;
  }
  if (pathname.startsWith('/clients')) return PERMISSIONS.clients.read;

  // Suppliers
  if (pathname.startsWith('/suppliers/new')) return PERMISSIONS.suppliers.create;
  if (pathname.includes('/suppliers/') && pathname.includes('/edit')) {
    return PERMISSIONS.suppliers.update;
  }
  if (pathname.startsWith('/suppliers')) return PERMISSIONS.suppliers.read;

  // Treasury
  if (pathname.startsWith('/treasury') || pathname.startsWith('/settings/account/banks')) {
    return PERMISSIONS.treasury.read;
  }

  // Withholding Tax
  if (
    pathname.startsWith('/withholding-tax') ||
    pathname.startsWith('/settings/system/tax') ||
    pathname.startsWith('/settings/system/withholding')
  ) {
    return PERMISSIONS.taxes.read;
  }

  if (pathname.startsWith('/settings/system/price-lists')) {
    return PERMISSIONS.price_lists.read;
  }

  // Document Settings
  if (
    pathname.startsWith('/settings/pdf') ||
    pathname.startsWith('/settings/system/conditions') ||
    pathname.startsWith('/settings/system/payment-conditions') ||
    pathname.startsWith('/settings/system/activity') ||
    pathname.startsWith('/settings/system/sequence')
  ) {
    return PERMISSIONS.document_settings.read;
  }

  if (
    pathname === '/settings' ||
    pathname.startsWith('/settings/account/profile')
  ) {
    return null;
  }

  // Enterprise / General Settings
  if (pathname.startsWith('/settings')) return PERMISSIONS.enterprise.read;

  return null;
};

const isAdminRoute = (pathname: string) =>
  pathname.startsWith('/administrative-tools') || pathname.startsWith('/settings/admin');

function Application({ className, Component, pageProps }: ApplicationProps) {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { status, storeReady, hasSessionTokens, isProtectedDataReady } = useAuthSyncStatus();
  const [hasMounted, setHasMounted] = React.useState(false);
  const redirectInFlightRef = React.useRef(false);
  const deniedActionToastRef = React.useRef<string | null>(null);

  const isAuthPage = publicRoutes.some((route) => router.pathname.startsWith(route));
  const isOnboardingPage = router.pathname.startsWith('/onboarding');
  const isNewCabinetOnboarding =
    isOnboardingPage &&
    new URLSearchParams(router.asPath.split('?')[1] ?? '').get('mode') === 'new';
  const isProtectedRoute = !isAuthPage;
  const shouldWaitForTokenSync =
    isProtectedRoute && status === 'authenticated' && hasSessionTokens && !isProtectedDataReady;
  const hasInvalidProtectedSession =
    isProtectedRoute &&
    (status === 'unauthenticated' || (status === 'authenticated' && !hasSessionTokens));
  const shouldLoadCurrentUser = status === 'authenticated' && hasSessionTokens;
  const { user, isFetchUserPending } = useCurrentUser({ enabled: shouldLoadCurrentUser });
  const normalizedRoleLabel = (user?.role?.label || '').trim().toLowerCase();
  const isAdmin =
    user?.roleType === 'ADMIN' ||
    user?.isCabinetPrincipalAdmin === true ||
    ['admin', 'owner', 'proprietaire', 'propriétaire'].includes(normalizedRoleLabel);
  const hasUserContext = Boolean(user);
  const canEvaluateOnboarding =
    status === 'authenticated' && hasSessionTokens && isProtectedDataReady && hasUserContext;
  const onboardingRequired = user?.onboardingRequired === true;
  const shouldWaitForUserContext =
    status === 'authenticated' &&
    hasSessionTokens &&
    isProtectedDataReady &&
    !hasUserContext &&
    isFetchUserPending;
  const shouldRedirectAuthenticatedAuth = isAuthPage && canEvaluateOnboarding;
  const hasIncompleteCabinet =
    user?.cabinets?.some((c) => c.onboardingCompleted !== true) ?? false;
  const shouldRedirectToOnboarding =
    canEvaluateOnboarding && isProtectedRoute && !isOnboardingPage && onboardingRequired;
  const shouldRedirectFromOnboarding =
    canEvaluateOnboarding &&
    isOnboardingPage &&
    !isNewCabinetOnboarding &&
    !onboardingRequired &&
    !hasIncompleteCabinet;
  // Stored read permissions drive menu/page visibility; effective permissions drive actions.
  const userPermissions = React.useMemo(
    () => user?.permissions || user?.effectivePermissions || [],
    [user?.permissions, user?.effectivePermissions]
  );
  const effectivePermissions = React.useMemo(
    () => user?.effectivePermissions || userPermissions,
    [user?.effectivePermissions, userPermissions]
  );
  const defaultProtectedRoute = React.useMemo(
    () => resolveDefaultRoute(userPermissions),
    [userPermissions]
  );
  const routeIsAdminOnly = isProtectedRoute && isAdminRoute(router.pathname);
  const actionRouteRule =
    isProtectedRoute && !routeIsAdminOnly ? resolveRouteAccess(router.asPath) : null;
  const routePermission =
    isProtectedRoute && !routeIsAdminOnly
      ? actionRouteRule?.permission || getRoutePermission(router.pathname)
      : null;
  const routePermissionsToCheck = isReadPermission(routePermission)
    ? userPermissions
    : effectivePermissions;
  const isRouteAllowed =
    isAdmin ||
    (!routeIsAdminOnly &&
      (!routePermission || hasPermission(routePermissionsToCheck, routePermission || undefined)));
  const shouldRedirectFromDeniedHome =
    canEvaluateOnboarding &&
    !onboardingRequired &&
    router.pathname === protectedHome &&
    Boolean(routePermission) &&
    !isRouteAllowed &&
    Boolean(defaultProtectedRoute) &&
    defaultProtectedRoute !== protectedHome;
  const shouldRedirectFromDeniedAction =
    canEvaluateOnboarding &&
    !onboardingRequired &&
    Boolean(actionRouteRule) &&
    !isRouteAllowed;

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (
      !hasMounted ||
      !storeReady ||
      status === 'loading' ||
      shouldWaitForTokenSync ||
      shouldWaitForUserContext
    )
      return;

    let redirectTarget: string | null = null;

    if (shouldRedirectAuthenticatedAuth) {
      redirectTarget = onboardingRequired ? onboardingRoute : defaultProtectedRoute || protectedHome;
    }

    if (hasInvalidProtectedSession) {
      redirectTarget = '/auth';
    }

    if (shouldRedirectToOnboarding) {
      redirectTarget = onboardingRoute;
    }

    if (shouldRedirectFromOnboarding) {
      redirectTarget = defaultProtectedRoute || protectedHome;
    }

    if (shouldRedirectFromDeniedHome) {
      redirectTarget = defaultProtectedRoute;
    }

    if (shouldRedirectFromDeniedAction && actionRouteRule) {
      redirectTarget = actionRouteRule.fallbackRoute;
      if (deniedActionToastRef.current !== router.asPath) {
        deniedActionToastRef.current = router.asPath;
        toast.error(tCommon(actionRouteRule.deniedMessageKey), {
          id: `rbac-route-${actionRouteRule.permission}`
        });
      }
    }

    if (!redirectTarget) {
      redirectInFlightRef.current = false;
      deniedActionToastRef.current = null;
      return;
    }

    if (redirectInFlightRef.current) return;

    redirectInFlightRef.current = true;
    router.replace(redirectTarget).finally(() => {
      redirectInFlightRef.current = false;
    });
  }, [
    hasInvalidProtectedSession,
    hasMounted,
    hasSessionTokens,
    isAuthPage,
    isOnboardingPage,
    isNewCabinetOnboarding,
    router,
    shouldRedirectAuthenticatedAuth,
    shouldRedirectFromOnboarding,
    shouldRedirectFromDeniedHome,
    shouldRedirectFromDeniedAction,
    shouldRedirectToOnboarding,
    shouldWaitForTokenSync,
    shouldWaitForUserContext,
    defaultProtectedRoute,
    onboardingRequired,
    status,
    storeReady,
    actionRouteRule,
    tCommon
  ]);

  const shouldBlockRender =
    !hasMounted ||
    !storeReady ||
    status === 'loading' ||
    shouldWaitForTokenSync ||
    shouldWaitForUserContext ||
    shouldRedirectAuthenticatedAuth ||
    shouldRedirectToOnboarding ||
    shouldRedirectFromOnboarding ||
    shouldRedirectFromDeniedHome ||
    shouldRedirectFromDeniedAction ||
    hasInvalidProtectedSession;

  if (shouldBlockRender) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Spinner />
      </main>
    );
  }

  const protectedContent =
    (routeIsAdminOnly || routePermission) && !isRouteAllowed ? (
      <AccessDenied />
    ) : (
      <Component {...pageProps} />
    );

  return (
    <div
      className={cn(`flex flex-col flex-1 overflow-hidden min-h-screen max-h-screen`, className)}>
      {isAuthPage || isOnboardingPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          {protectedContent}
        </Layout>
      )}
      <Toaster className="m-5" />
    </div>
  );
}

export default Application;

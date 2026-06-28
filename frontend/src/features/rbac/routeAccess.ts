import { PERMISSIONS } from './permissions';

export type RouteAccessRule = {
  permission: string;
  deniedMessageKey: string;
  fallbackRoute: string;
};

const DOCUMENT_UPDATE_ROUTES = [
  {
    pattern:
      /^\/selling\/(invoice|quotation|customer-order|delivery-note|goods-issue-note|credit-note|return-note)\/[^/]+\/?$/,
    permission: PERMISSIONS.selling_documents.update,
    deniedMessageKey: 'rbac.requiresSellingDocumentsUpdate',
    fallbackRouteByType: {
      invoice: '/selling/invoices',
      quotation: '/selling/quotations',
      'customer-order': '/selling/customer-orders',
      'delivery-note': '/selling/delivery-notes',
      'goods-issue-note': '/selling/goods-issue-notes',
      'credit-note': '/selling/credit-notes',
      'return-note': '/selling/return-notes'
    }
  },
  {
    pattern:
      /^\/buying\/(facture-achat|commande-fournisseur|bon-reception|avoir-fournisseur|retour-fournisseur)\/[^/]+\/?$/,
    permission: PERMISSIONS.buying_documents.update,
    deniedMessageKey: 'rbac.requiresBuyingDocumentsUpdate',
    fallbackRouteByType: {
      'facture-achat': '/buying/factures-achat',
      'commande-fournisseur': '/buying/commandes-fournisseurs',
      'bon-reception': '/buying/bons-reception',
      'avoir-fournisseur': '/buying/avoirs-fournisseurs',
      'retour-fournisseur': '/buying/retours-fournisseurs'
    }
  }
] as const;

const normalizePath = (path: string) => {
  const pathname = path.split('?')[0]?.split('#')[0] || '/';
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
};

const matchDocumentUpdateRoute = (pathname: string): RouteAccessRule | null => {
  for (const route of DOCUMENT_UPDATE_ROUTES) {
    const match = pathname.match(route.pattern);
    const documentType = match?.[1] as keyof typeof route.fallbackRouteByType | undefined;

    if (documentType) {
      return {
        permission: route.permission,
        deniedMessageKey: route.deniedMessageKey,
        fallbackRoute: route.fallbackRouteByType[documentType]
      };
    }
  }

  return null;
};

export const resolveRouteAccess = (path: string): RouteAccessRule | null => {
  const pathname = normalizePath(path);
  const documentUpdateRule = matchDocumentUpdateRoute(pathname);
  if (documentUpdateRule) return documentUpdateRule;

  const sellingCreateFallbacks: Record<string, string> = {
    '/selling/new-invoice': '/selling/invoices',
    '/selling/new-quotation': '/selling/quotations',
    '/selling/new-customer-order': '/selling/customer-orders',
    '/selling/new-delivery-note': '/selling/delivery-notes',
    '/selling/new-goods-issue-note': '/selling/goods-issue-notes',
    '/selling/new-credit-note': '/selling/credit-notes',
    '/selling/new-return-note': '/selling/return-notes'
  };

  if (sellingCreateFallbacks[pathname]) {
    return {
      permission: PERMISSIONS.selling_documents.create,
      deniedMessageKey: 'rbac.requiresSellingDocumentsCreate',
      fallbackRoute: sellingCreateFallbacks[pathname]
    };
  }

  const buyingCreateFallbacks: Record<string, string> = {
    '/buying/nouvelle-facture-achat': '/buying/factures-achat',
    '/buying/nouvelle-commande-fournisseur': '/buying/commandes-fournisseurs',
    '/buying/nouveau-bon-reception': '/buying/bons-reception',
    '/buying/nouvel-avoir-fournisseur': '/buying/avoirs-fournisseurs',
    '/buying/nouveau-retour-fournisseur': '/buying/retours-fournisseurs'
  };

  if (buyingCreateFallbacks[pathname]) {
    return {
      permission: PERMISSIONS.buying_documents.create,
      deniedMessageKey: 'rbac.requiresBuyingDocumentsCreate',
      fallbackRoute: buyingCreateFallbacks[pathname]
    };
  }

  if (pathname === '/selling/new-payment' || pathname === '/buying/new-payment') {
    return {
      permission: PERMISSIONS.payments.create,
      deniedMessageKey: 'rbac.requiresPaymentsCreate',
      fallbackRoute: pathname.startsWith('/buying') ? '/buying/payments' : '/selling/payments'
    };
  }

  if (/^\/(selling|buying)\/payment\/[^/]+$/.test(pathname)) {
    const buying = pathname.startsWith('/buying');
    return {
      permission: PERMISSIONS.payments.update,
      deniedMessageKey: 'rbac.requiresPaymentsUpdate',
      fallbackRoute: buying ? '/buying/payments' : '/selling/payments'
    };
  }

  if (pathname === '/payments/new') {
    return {
      permission: PERMISSIONS.payments.create,
      deniedMessageKey: 'rbac.requiresPaymentsCreate',
      fallbackRoute: '/payments'
    };
  }

  if (/^\/payments\/[^/]+\/edit$/.test(pathname)) {
    return {
      permission: PERMISSIONS.payments.update,
      deniedMessageKey: 'rbac.requiresPaymentsUpdate',
      fallbackRoute: '/payments'
    };
  }

  if (pathname === '/articles/new') {
    return {
      permission: PERMISSIONS.products.create,
      deniedMessageKey: 'rbac.requiresProductsCreate',
      fallbackRoute: '/articles'
    };
  }

  if (/^\/articles\/[^/]+$/.test(pathname)) {
    return {
      permission: PERMISSIONS.products.update,
      deniedMessageKey: 'rbac.requiresProductsUpdate',
      fallbackRoute: '/articles'
    };
  }

  for (const resource of ['clients', 'suppliers'] as const) {
    const permissions = PERMISSIONS[resource];
    const translationResource = resource === 'clients' ? 'Clients' : 'Suppliers';

    if (pathname === `/${resource}/new`) {
      return {
        permission: permissions.create,
        deniedMessageKey: `rbac.requires${translationResource}Create`,
        fallbackRoute: `/${resource}`
      };
    }

    if (new RegExp(`^/${resource}/[^/]+/edit$`).test(pathname)) {
      return {
        permission: permissions.update,
        deniedMessageKey: `rbac.requires${translationResource}Update`,
        fallbackRoute: `/${resource}`
      };
    }
  }

  return null;
};

export const canAccessRoute = ({
  effectivePermissions,
  isAdmin,
  path
}: {
  effectivePermissions: string[];
  isAdmin: boolean;
  path: string;
}) => {
  const rule = resolveRouteAccess(path);
  return !rule || isAdmin || effectivePermissions.includes(rule.permission);
};

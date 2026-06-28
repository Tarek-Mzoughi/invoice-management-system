import * as React from 'react';
import {
  ArrowLeftRight,
  Bot,
  File,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  useSidebar
} from '@/components/ui/sidebar';
import { MainNav } from './MainNav';
import { CabinetSwitcher } from './CabinetSwitcher';
import { UserSidebarMenu } from './UserSidebarMenu';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-light.png';
import { AppModuleKey, useModuleSettingsStore } from '@/hooks/stores/useModuleSettingsStore';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import { PERMISSIONS } from '@/features/rbac/permissions';
import { useCurrentPermissions } from '@/features/rbac/usePermissions';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { theme } = useTheme();
  const invoiceLabels = useSellingInvoiceLabels({ scope: 'selling' });
  const { hasPermission, isPending: isPermissionsPending } = useCurrentPermissions();
  const moduleSettings = useModuleSettingsStore((state) => state.modules);
  const modulesReady = useModuleSettingsStore((state) => state._ready);
  const currentPath = router.asPath;
  const currentRoute = router.pathname;

  const isRouteActive = React.useCallback(
    (route: string) => {
      if (route === '#') return false;

      const [routePath, routeQuery] = route.split('?');
      const [pathWithoutQuery] = currentPath.split('?');

      if (routeQuery) {
        return currentPath === route;
      }

      return (
        currentRoute === routePath ||
        pathWithoutQuery === routePath ||
        pathWithoutQuery.startsWith(`${routePath}/`)
      );
    },
    [currentPath, currentRoute]
  );

  const isPathPrefixActive = React.useCallback(
    (prefix: string) => currentRoute === prefix || currentRoute.startsWith(`${prefix}/`),
    [currentRoute]
  );

  const isSupplierContactRouteActive =
    isPathPrefixActive('/suppliers') ||
    (currentPath.includes('entity=suppliers') &&
      (currentRoute === '/contacts/firms' ||
        currentRoute === '/contacts/new-firm' ||
        isPathPrefixActive('/contacts/firm') ||
        isPathPrefixActive('/contacts/modify-firm')));

  const isSupplierOrderRouteActive =
    isRouteActive('/buying/commandes-fournisseurs') ||
    isRouteActive('/buying/commande-fournisseur') ||
    isPathPrefixActive('/buying/nouvelle-commande-fournisseur');
  const isGoodsReceiptNoteRouteActive =
    isRouteActive('/buying/bons-reception') ||
    isRouteActive('/buying/bon-reception') ||
    isPathPrefixActive('/buying/nouveau-bon-reception');
  const isPurchaseInvoiceRouteActive =
    isRouteActive('/buying/factures-achat') ||
    isPathPrefixActive('/buying/facture-achat') ||
    isPathPrefixActive('/buying/nouvelle-facture-achat');
  const isSupplierCreditNoteRouteActive =
    isRouteActive('/buying/avoirs-fournisseurs') ||
    isRouteActive('/buying/avoir-fournisseur') ||
    isPathPrefixActive('/buying/nouvel-avoir-fournisseur');
  const isSupplierReturnNoteRouteActive =
    isRouteActive('/buying/retours-fournisseurs') ||
    isRouteActive('/buying/retour-fournisseur') ||
    isPathPrefixActive('/buying/nouveau-retour-fournisseur');
  const isBuyingDocumentRouteActive =
    isSupplierOrderRouteActive ||
    isGoodsReceiptNoteRouteActive ||
    isPurchaseInvoiceRouteActive ||
    isSupplierCreditNoteRouteActive ||
    isSupplierReturnNoteRouteActive;

  const isModuleEnabled = React.useCallback(
    (key: AppModuleKey) => {
      if (!modulesReady) return true;

      return moduleSettings[key];
    },
    [moduleSettings, modulesReady]
  );

  const canAccessPermission = React.useCallback(
    (permission?: string) => {
      if (!permission) return true;
      if (isPermissionsPending) return false; // Strict: hide during loading
      return hasPermission(permission);
    },
    [hasPermission, isPermissionsPending]
  );
  const readableNavigationPermissions = React.useMemo(
    () => [
      PERMISSIONS.dashboard.read,
      PERMISSIONS.selling_documents.read,
      PERMISSIONS.buying_documents.read,
      PERMISSIONS.payments.read,
      PERMISSIONS.treasury.read,
      PERMISSIONS.taxes.read,
      PERMISSIONS.clients.read,
      PERMISSIONS.suppliers.read,
      PERMISSIONS.products.read,
      PERMISSIONS.enterprise.read,
      PERMISSIONS.document_settings.read
    ],
    []
  );
  const hasReadableNavigationPermission =
    !isPermissionsPending &&
    readableNavigationPermissions.some((permission) => hasPermission(permission));

  const navMain = [
      {
        id: 1,
        title: tCommon('menu.dashboard'),
        url: '/dashboard',
        icon: LayoutDashboard,
        permission: PERMISSIONS.dashboard.read,
        isActive: isRouteActive('/dashboard')
      },
      {
        id: 3,
        title: tCommon('menu.selling'),
        url: '#',
        icon: Package,
        permission: PERMISSIONS.selling_documents.read,
        isActive: isPathPrefixActive('/selling'),
        items: [
          {
            title: tCommon('submenu.quotations'),
            url: '/selling/quotations',
            icon: File,
            permission: PERMISSIONS.selling_documents.read,
            isActive:
              isRouteActive('/selling/quotations') ||
              isRouteActive('/selling/quotation') ||
              isPathPrefixActive('/selling/new-quotation')
          },
          {
            title: invoiceLabels.plural,
            url: '/selling/invoices',
            icon: FileText,
            permission: PERMISSIONS.selling_documents.read,
            isActive:
              isRouteActive('/selling/invoices') ||
              isPathPrefixActive('/selling/invoice') ||
              isPathPrefixActive('/selling/new-invoice')
          },
          {
            title: tCommon('submenu.customer_order'),
            url: '/selling/customer-orders',
            icon: File,
            permission: PERMISSIONS.selling_documents.read,
            isActive:
              isRouteActive('/selling/customer-orders') ||
              isRouteActive('/selling/customer-order') ||
              isPathPrefixActive('/selling/new-customer-order')
          },
          {
            title: tCommon('submenu.delivery_note'),
            url: '/selling/delivery-notes',
            icon: File,
            permission: PERMISSIONS.selling_documents.read,
            isActive:
              isRouteActive('/selling/delivery-notes') ||
              isRouteActive('/selling/delivery-note') ||
              isPathPrefixActive('/selling/new-delivery-note')
          },
          {
            title: tCommon('submenu.goods_issue_note'),
            url: '/selling/goods-issue-notes',
            icon: File,
            permission: PERMISSIONS.selling_documents.read,
            isActive:
              isRouteActive('/selling/goods-issue-notes') ||
              isRouteActive('/selling/goods-issue-note') ||
              isPathPrefixActive('/selling/new-goods-issue-note')
          },
          {
            title: tCommon('submenu.credit_note'),
            url: '/selling/credit-notes',
            icon: File,
            permission: PERMISSIONS.selling_documents.read,
            isActive:
              isRouteActive('/selling/credit-notes') ||
              isRouteActive('/selling/credit-note') ||
              isPathPrefixActive('/selling/new-credit-note')
          },
          {
            title: tCommon('submenu.return_note'),
            url: '/selling/return-notes',
            icon: File,
            permission: PERMISSIONS.selling_documents.read,
            isActive:
              isRouteActive('/selling/return-notes') ||
              isRouteActive('/selling/return-note') ||
              isPathPrefixActive('/selling/new-return-note')
          }
        ]
      },
      {
        id: 4,
        title: tCommon('menu.buying'),
        url: '#',
        icon: ShoppingCart,
        permission: PERMISSIONS.buying_documents.read,
        isActive: isBuyingDocumentRouteActive,
        items: [
          {
            title: tCommon('submenu.supplier_order'),
            url: '/buying/commandes-fournisseurs',
            icon: File,
            permission: PERMISSIONS.buying_documents.read,
            isActive: isSupplierOrderRouteActive
          },
          {
            title: tCommon('submenu.goods_receipt_note'),
            url: '/buying/bons-reception',
            icon: File,
            permission: PERMISSIONS.buying_documents.read,
            isActive: isGoodsReceiptNoteRouteActive
          },
          {
            title: tCommon('submenu.purchase_invoice'),
            url: '/buying/factures-achat',
            icon: File,
            permission: PERMISSIONS.buying_documents.read,
            isActive: isPurchaseInvoiceRouteActive
          },
          {
            title: tCommon('submenu.supplier_credit_note'),
            url: '/buying/avoirs-fournisseurs',
            icon: File,
            permission: PERMISSIONS.buying_documents.read,
            isActive: isSupplierCreditNoteRouteActive
          },
          {
            title: tCommon('submenu.supplier_return_note'),
            url: '/buying/retours-fournisseurs',
            icon: File,
            permission: PERMISSIONS.buying_documents.read,
            isActive: isSupplierReturnNoteRouteActive
          }
        ]
      },
      {
        id: 5,
        title: tCommon('menu.payments'),
        url: '/payments',
        icon: Wallet,
        permission: PERMISSIONS.payments.read,
        isActive:
          isRouteActive('/payments') ||
          isRouteActive('/selling/payments') ||
          isRouteActive('/buying/payments') ||
          isPathPrefixActive('/selling/payment') ||
          isPathPrefixActive('/buying/payment') ||
          isPathPrefixActive('/selling/new-payment') ||
          isPathPrefixActive('/buying/new-payment')
      },
      {
        id: 6,
        title: tCommon('menu.treasury'),
        url: '#',
        icon: Landmark,
        permission: PERMISSIONS.treasury.read,
        isActive: isRouteActive('/settings/account/banks') || isPathPrefixActive('/treasury'),
        items: [
          {
            title: tCommon('submenu.accounts'),
            url: '/settings/account/banks',
            icon: Wallet,
            permission: PERMISSIONS.treasury.read,
            isActive: isRouteActive('/settings/account/banks')
          },
          {
            title: tCommon('submenu.transactions'),
            url: '/treasury/transactions',
            icon: ArrowLeftRight,
            permission: PERMISSIONS.treasury.read,
            isActive: isPathPrefixActive('/treasury/transactions')
          },
          {
            title: tCommon('submenu.checks_and_drafts'),
            url: '/treasury/checks-and-drafts',
            icon: FileText,
            permission: PERMISSIONS.treasury.read,
            isActive: isPathPrefixActive('/treasury/checks-and-drafts')
          }
        ]
      },
      {
        id: 7,
        title: tCommon('menu.withholding'),
        url: '#',
        icon: Percent,
        permission: PERMISSIONS.taxes.read,
        isActive: isPathPrefixActive('/withholding-tax'),
        items: [
          {
            title: tCommon('submenu.sales_withholding'),
            url: '/withholding-tax/sales',
            icon: FileText,
            permission: PERMISSIONS.taxes.read,
            isActive: isRouteActive('/withholding-tax/sales')
          },
          {
            title: tCommon('submenu.purchase_other_withholding'),
            url: '/withholding-tax/purchases',
            icon: FileText,
            permission: PERMISSIONS.taxes.read,
            isActive: isRouteActive('/withholding-tax/purchases')
          }
        ]
      },
      {
        id: 8,
        title: tCommon('menu.clients'),
        url: '/clients',
        icon: Users,
        permission: PERMISSIONS.clients.read,
        isActive:
          isPathPrefixActive('/clients') ||
          (currentRoute === '/contacts/firms' &&
            (currentPath.includes('entity=clients') || !currentPath.includes('entity=')) &&
            !isPathPrefixActive('/contacts/firm'))
      },
      {
        id: 9,
        title: tCommon('menu.suppliers'),
        url: '/suppliers',
        icon: Truck,
        permission: PERMISSIONS.suppliers.read,
        isActive:
          isRouteActive('/buying/fournisseurs') ||
          isPathPrefixActive('/suppliers') ||
          isSupplierContactRouteActive
      },
      {
        id: 10,
        title: tCommon('menu.articles'),
        url: '/articles',
        icon: Package,
        permission: PERMISSIONS.products.read,
        isActive: isRouteActive('/articles')
      },
      {
        id: 11,
        title: tCommon('menu.ai_assistant'),
        url: '/ai-assistant',
        icon: Bot,
        hidden: !hasReadableNavigationPermission,
        isActive: isRouteActive('/ai-assistant')
      }
    ]
      .map((item) => ({
        ...item,
        items: item.items?.filter((subItem) => canAccessPermission(subItem.permission))
      }))
      .filter((item) => {
      if (item.hidden) return false;

      const moduleMap: Partial<Record<number, AppModuleKey>> = {
        3: 'selling',
        4: 'buying',
        5: 'payments',
        6: 'treasury',
        7: 'withholding',
        8: 'clients',
        9: 'suppliers',
        10: 'articles',
        11: 'ai_assistant'
      };

      const moduleKey = moduleMap[item.id];

      if (!canAccessPermission(item.permission)) return false;
      if (item.items && item.items.length === 0) return false;
      if (!moduleKey) return true;

      return isModuleEnabled(moduleKey);
    });

  const settingsItem = !isPermissionsPending
    ? {
        id: 12,
        title: tCommon('menu.settings'),
        url: '/settings',
        icon: Settings,
        isActive: isPathPrefixActive('/settings') || isPathPrefixActive('/administrative-tools')
      }
    : null;
  const { open, toggleSidebar } = useSidebar();

  const hoverToggledRef = React.useRef(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation();
    if (!open) {
      toggleSidebar();
      hoverToggledRef.current = true;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation();
    if (hoverToggledRef.current) {
      toggleSidebar();
      hoverToggledRef.current = false;
    }
  };

  return (
    <>
      <Sidebar
        collapsible="icon"
        {...props}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(theme === 'dark' ? logoDark : logoLight).src}
              alt={tCommon('app_name')}
              className="shrink-0 cursor-pointer h-8 w-auto"
              onClick={() => router.push('/dashboard')}
            />
            <span className="text-lg font-bold truncate group-data-[collapsible=icon]:hidden">
              {tCommon('app_name')}
            </span>
          </div>
          <CabinetSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <MainNav items={navMain} />
        </SidebarContent>
        <SidebarFooter>
          {settingsItem && (
            <MainNav items={[settingsItem]} />
          )}
          <SidebarSeparator />
          <UserSidebarMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}

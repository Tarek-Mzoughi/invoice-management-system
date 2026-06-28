import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Blocks,
  Building2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Hash,
  Landmark,
  Logs,
  Percent,
  Tags,
  User,
  ShieldCheck,
  UsersRound
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentPermissions } from '@/features/rbac/usePermissions';

interface SettingsPortalProps {
  className?: string;
}

type SettingsCardItem = {
  key: string;
  route?: string;
  icon: React.ComponentType<{ className?: string }>;
  available?: boolean;
};

type SettingsSection = {
  key: string;
  items: SettingsCardItem[];
};

const sectionTitleClassName = 'text-[2rem] font-semibold tracking-tight text-foreground';
const cardClassName =
  'group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-6 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/40';

const sections: SettingsSection[] = [
  {
    key: 'account',
    items: [
      { key: 'profile', route: '/settings/account/profile', icon: User, available: true },
      { key: 'modules', route: '/settings/account/modules', icon: Blocks, available: true }
    ]
  },
  {
    key: 'business',
    items: [
      { key: 'enterprise', route: '/settings/account/cabinet', icon: Building2, available: true },
      { key: 'taxes', route: '/settings/system/tax', icon: Percent, available: true },
      { key: 'price_lists', route: '/settings/system/price-lists', icon: ClipboardList, available: true },
      { key: 'activity_types', route: '/settings/system/activity', icon: Tags, available: true },
      {
        key: 'payment_conditions',
        route: '/settings/system/payment-conditions',
        icon: CreditCard,
        available: true
      },
      {
        key: 'withholding',
        route: '/settings/system/withholding',
        icon: Percent,
        available: true
      }
    ]
  },
  {
    key: 'system',
    items: [
      { key: 'pdf_templates', route: '/settings/pdf/templates', icon: FileText, available: true },
      {
        key: 'document_numbering',
        route: '/settings/system/sequence',
        icon: Hash,
        available: true
      }
    ]
  },
  {
    key: 'admin_tools',
    items: [
      {
        key: 'user_management',
        route: '/settings/admin/users',
        icon: UsersRound,
        available: true
      },
      {
        key: 'roles',
        route: '/settings/admin/roles',
        icon: ShieldCheck,
        available: true
      },
      {
        key: 'permissions',
        route: '/settings/admin/permissions',
        icon: ClipboardList,
        available: true
      },
      {
        key: 'activity_logs',
        route: '/settings/admin/logs',
        icon: Logs,
        available: true
      }
    ]
  }
];

const SettingsCard = ({
  item,
  onUnavailable
}: {
  item: SettingsCardItem;
  onUnavailable: (itemKey: string) => void;
}) => {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const Icon = item.icon;

  const handleClick = () => {
    if (item.available && item.route) {
      router.push(item.route);
      return;
    }

    onUnavailable(item.key);
  };

  return (
    <button type="button" onClick={handleClick} className={cardClassName}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[1.05rem] font-semibold text-foreground">
          {t(`home.cards.${item.key}.title`)}
        </p>
        <p className="mt-1 text-base leading-7 text-muted-foreground">
          {t(`home.cards.${item.key}.description`)}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
};

export const SettingsPortal = ({ className }: SettingsPortalProps) => {
  const { t: tSettings } = useTranslation('settings');
  const { isAdmin, isPending } = useCurrentPermissions();
  const canSeeAdminTools = !isPending && isAdmin;
  const visibleSections = React.useMemo(
    () =>
      sections
        .map((section) =>
          section.key === 'admin_tools' && !canSeeAdminTools
            ? { ...section, items: [] }
            : section
        )
        .filter((section) => section.items.length > 0),
    [canSeeAdminTools]
  );

  const handleUnavailable = React.useCallback(
    (itemKey: string) => {
      toast.info(
        tSettings('home.messages.coming_soon', {
          item: tSettings(`home.cards.${itemKey}.title`)
        })
      );
    },
    [tSettings]
  );

  return (
    <div className={cn('flex flex-1 flex-col overflow-auto px-5 py-6 lg:px-10 lg:py-8', className)}>
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-6">
        <div>
          <h1 className={sectionTitleClassName}>{tSettings('home.title')}</h1>
          <p className="mt-2 text-xl text-muted-foreground">
            {tSettings('home.description')}
          </p>
        </div>

        {visibleSections.map((section) => (
          <section key={section.key} className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-[1.75rem] font-semibold text-foreground">
                {tSettings(`home.sections.${section.key}`)}
              </h2>
              <div className="h-px w-full bg-border" />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {section.items.map((item) => (
                <SettingsCard key={item.key} item={item} onUnavailable={handleUnavailable} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

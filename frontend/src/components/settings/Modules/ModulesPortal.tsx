import * as React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bot,
  Building2,
  Landmark,
  MessageCircle,
  Percent,
  ReceiptText,
  ShoppingCart,
  Tags,
  Users,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  AppModuleKey,
  ModuleSettings,
  useModuleSettingsStore
} from '@/hooks/stores/useModuleSettingsStore';

interface ModulesPortalProps {
  className?: string;
}

type ModuleCard = {
  key: AppModuleKey;
  icon: React.ComponentType<{ className?: string }>;
};

const modules: ModuleCard[] = [
  { key: 'selling', icon: ReceiptText },
  { key: 'buying', icon: ShoppingCart },
  { key: 'payments', icon: Wallet },
  { key: 'treasury', icon: Landmark },
  { key: 'suppliers', icon: Building2 },
  { key: 'clients', icon: Users },
  { key: 'articles', icon: Tags },
  { key: 'withholding', icon: Percent },
  { key: 'ai_assistant', icon: Bot },
  { key: 'ai_floating_button', icon: MessageCircle }
];

const areModulesEqual = (left: ModuleSettings, right: ModuleSettings) =>
  (Object.keys(left) as AppModuleKey[]).every((key) => left[key] === right[key]);

export const ModulesPortal = ({ className }: ModulesPortalProps) => {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const savedModules = useModuleSettingsStore((state) => state.modules);
  const storeReady = useModuleSettingsStore((state) => state._ready);
  const setModules = useModuleSettingsStore((state) => state.setModules);
  const [draftModules, setDraftModules] = React.useState<ModuleSettings>(savedModules);

  React.useEffect(() => {
    setDraftModules(savedModules);
  }, [savedModules]);

  const hasChanges = React.useMemo(
    () => !areModulesEqual(draftModules, savedModules),
    [draftModules, savedModules]
  );

  const handleToggle = React.useCallback((key: AppModuleKey, enabled: boolean) => {
    setDraftModules((current) => ({
      ...current,
      [key]: enabled
    }));
  }, []);

  const handleSave = React.useCallback(() => {
    setModules(draftModules);
    toast.success(t('modules_page.messages.save_success'));
  }, [draftModules, setModules, t]);

  return (
    <div className={cn('flex flex-1 flex-col overflow-auto px-4 py-5 lg:px-8 lg:py-6', className)}>
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <div className="flex flex-wrap items-start gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg px-4 text-sm font-medium transition-all"
            onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon('commands.back')}
          </Button>
        </div>

        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
            {t('modules_page.title')}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {t('modules_page.description')}
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const checked = draftModules[module.key];

              return (
                <div
                  key={module.key}
                  className={cn(
                    "flex items-start gap-4 rounded-xl border px-5 py-4.5 transition-all duration-300 shadow-sm",
                    checked
                      ? "border-primary/30 bg-primary/5 hover:border-primary/45 hover:bg-primary/10"
                      : "border-border/80 bg-background hover:border-primary/20 hover:bg-accent/30"
                  )}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-foreground">
                      {t(`modules_page.items.${module.key}.title`)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {t(`modules_page.items.${module.key}.description`)}
                    </p>
                  </div>

                  <Switch
                    checked={checked}
                    onCheckedChange={(enabled) => handleToggle(module.key, enabled)}
                    className="mt-0.5 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-5 h-px w-full bg-border" />

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              className="h-10 rounded-lg px-5 text-sm font-medium transition-all"
              onClick={handleSave}
              disabled={!storeReady || !hasChanges}>
              {t('modules_page.actions.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

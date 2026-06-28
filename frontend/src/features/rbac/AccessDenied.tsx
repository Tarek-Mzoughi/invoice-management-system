import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AccessDenied = () => {
  const { t: tCommon } = useTranslation('common');

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
      <ShieldAlert className="h-10 w-10 text-zinc-400" />
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
        {tCommon('rbac.sectionUnavailable', "Cette section n'est pas disponible pour votre rôle.")}
      </p>
    </div>
  );
};

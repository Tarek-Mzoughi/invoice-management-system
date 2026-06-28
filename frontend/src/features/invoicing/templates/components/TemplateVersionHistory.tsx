import React from 'react';
import { History, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/shared';
import { DocumentTemplateVersion } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

interface TemplateVersionHistoryProps {
  versions: DocumentTemplateVersion[];
  isPending?: boolean;
  isRestoring?: boolean;
  restoringVersionId?: number;
  onRestoreVersion: (versionId: number) => void;
}

export const TemplateVersionHistory = ({
  versions,
  isPending = false,
  isRestoring = false,
  restoringVersionId,
  onRestoreVersion
}: TemplateVersionHistoryProps) => {
  const { t: tSettings } = useTranslation('settings');
  const { locale } = useRouter();
  const dateLocale = locale === 'fr' ? fr : undefined;

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden">
      <div className="space-y-1 px-1">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{tSettings('pdf_editor.right_panel.history.title')}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {tSettings('pdf_editor.right_panel.history.description')}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 px-1 pb-4">
          {isPending ? (
            <div className="flex justify-center py-8">
              <Spinner show />
            </div>
          ) : versions.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
              <History className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
              <p className="text-xs text-zinc-500">
                {tSettings('pdf_editor.right_panel.history.no_history')}
              </p>
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="group relative rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-50">
                      Version {version.versionNumber}
                    </p>
                    {version.createdAt && (
                      <p className="mt-0.5 text-[10px] text-zinc-500">
                        {format(new Date(version.createdAt), 'PPp', { locale: dateLocale })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => onRestoreVersion(version.id)}
                    disabled={isRestoring}
                  >
                    {isRestoring && restoringVersionId === version.id ? (
                      <Spinner size="small" />
                    ) : (
                      <RotateCcw className="mr-1 h-3 w-3" />
                    )}
                    {tSettings('pdf_editor.right_panel.history.restore')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

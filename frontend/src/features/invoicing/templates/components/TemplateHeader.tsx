import { ArrowLeft, Download, Eye, Save, Star, UploadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { DOCUMENT_TEMPLATE_STATUS } from '@/types';
import { useTranslation } from 'react-i18next';

interface TemplateHeaderProps {
  templateName: string;
  status?: DOCUMENT_TEMPLATE_STATUS;
  isDirty: boolean;
  canSave: boolean;
  canSetDefault?: boolean;
  saving?: boolean;
  previewing?: boolean;
  generating?: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onGeneratePdf: () => void;
  onSetDefault?: () => void;
}

export const TemplateHeader = ({
  templateName,
  status,
  isDirty,
  canSave,
  canSetDefault,
  saving,
  previewing,
  generating,
  onBack,
  onSaveDraft,
  onPublish,
  onPreview,
  onGeneratePdf,
  onSetDefault
}: TemplateHeaderProps) => {
  const { t: tSettings } = useTranslation('settings');

  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="outline" size="icon" onClick={onBack} title={tSettings('pdf_editor.header.back')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {templateName || tSettings('pdf_editor.default_name')}
            </h1>
            <Badge variant={status === DOCUMENT_TEMPLATE_STATUS.PUBLISHED ? 'default' : 'outline'}>
              {status || DOCUMENT_TEMPLATE_STATUS.DRAFT}
            </Badge>
            {isDirty ? <Badge variant="secondary">{tSettings('pdf_editor.unsaved')}</Badge> : null}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tSettings('pdf_editor.builder_title')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreview} disabled={previewing || saving}>
          {previewing ? <Spinner size="small" /> : <Eye className="h-4 w-4" />}
          {tSettings('pdf_editor.header.preview')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGeneratePdf}
          disabled={generating || isDirty}
          title={isDirty ? tSettings('pdf_editor.header.tooltips.save_before_generate') : tSettings('pdf_editor.header.tooltips.generate_pdf')}
        >
          {generating ? <Spinner size="small" /> : <Download className="h-4 w-4" />}
          {tSettings('pdf_editor.header.generate')}
        </Button>
        {canSetDefault && onSetDefault ? (
          <Button variant="outline" size="sm" onClick={onSetDefault} disabled={saving || isDirty}>
            <Star className="h-4 w-4" />
            {tSettings('pdf_editor.header.set_default')}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onPublish} disabled={saving}>
          <UploadCloud className="h-4 w-4" />
          {tSettings('pdf_editor.header.publish')}
        </Button>
        <Button size="sm" onClick={onSaveDraft} disabled={!canSave || saving}>
          {saving ? <Spinner size="small" /> : <Save className="h-4 w-4" />}
          {tSettings('pdf_editor.header.save')}
        </Button>
      </div>
    </div>
  );
};

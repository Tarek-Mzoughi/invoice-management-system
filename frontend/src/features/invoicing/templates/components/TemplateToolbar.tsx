import { ArrowLeft, Download, Eye, Save, Star, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared';
import { DOCUMENT_TEMPLATE_STATUS } from '@/types';

interface TemplateToolbarProps {
  status?: DOCUMENT_TEMPLATE_STATUS;
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

export const TemplateToolbar = ({
  status,
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
}: TemplateToolbarProps) => (
  <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onBack} title="Back">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">PDF template editor</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{status || DOCUMENT_TEMPLATE_STATUS.DRAFT}</p>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onPreview} disabled={previewing}>
        {previewing ? <Spinner size="small" /> : <Eye className="h-4 w-4" />}
        Preview
      </Button>
      <Button variant="outline" size="sm" onClick={onGeneratePdf} disabled={generating}>
        {generating ? <Spinner size="small" /> : <Download className="h-4 w-4" />}
        Generate
      </Button>
      {canSetDefault && onSetDefault ? (
        <Button variant="outline" size="sm" onClick={onSetDefault}>
          <Star className="h-4 w-4" />
          Default
        </Button>
      ) : null}
      <Button variant="outline" size="sm" onClick={onPublish} disabled={saving}>
        <UploadCloud className="h-4 w-4" />
        Publish
      </Button>
      <Button size="sm" onClick={onSaveDraft} disabled={saving}>
        {saving ? <Spinner size="small" /> : <Save className="h-4 w-4" />}
        Save
      </Button>
    </div>
  </div>
);

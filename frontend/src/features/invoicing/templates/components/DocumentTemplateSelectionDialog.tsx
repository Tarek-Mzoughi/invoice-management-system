import React from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, Eye, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE, DocumentTemplate } from '@/types';
import { getErrorMessage } from '@/utils/errors';

interface DocumentTemplateSelectionDialogProps {
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  documentId: number;
  filename: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviewReady: (blob: Blob, filename: string) => void;
  onUseSystemPreview?: () => void;
  onUseSystemDownload?: () => void;
}

export const DocumentTemplateSelectionDialog: React.FC<
  DocumentTemplateSelectionDialogProps
> = ({
  documentType,
  documentId,
  filename,
  open,
  onOpenChange,
  onPreviewReady,
  onUseSystemPreview,
  onUseSystemDownload
}) => {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<number | null>(null);

  const { data: templates = [], isPending } = useQuery({
    queryKey: ['document-template-available', documentType],
    queryFn: () => api.documentTemplate.getAvailableTemplates(documentType),
    enabled: open
  });

  React.useEffect(() => {
    if (!open || templates.length === 0) return;
    const defaultTemplate = templates.find((template) => template.isDefault);
    setSelectedTemplateId(defaultTemplate?.id || templates[0]?.id || null);
  }, [open, templates]);

  const selectedTemplate = React.useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [selectedTemplateId, templates]
  );

  const previewMutation = useMutation({
    mutationFn: (template: DocumentTemplate) =>
      api.documentTemplate.previewDocumentWithTemplate({
        documentType,
        documentId,
        templateId: template.id,
        cabinetId: template.cabinetId
      }),
    onSuccess: (blob) => {
      onPreviewReady(blob, filename);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, 'Unable to preview with this template'));
    }
  });

  const downloadMutation = useMutation({
    mutationFn: (template: DocumentTemplate) =>
      api.documentTemplate.generateDocumentWithTemplate(
        {
          documentType,
          documentId,
          templateId: template.id,
          cabinetId: template.cabinetId,
          storeGeneratedDocument: false
        },
        filename
      ),
    onSuccess: () => {
      toast.success('PDF generated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, 'Unable to generate with this template'));
    }
  });

  const hasTemplates = templates.length > 0;
  const isActionPending = previewMutation.isPending || downloadMutation.isPending;

  const handlePreview = () => {
    if (!selectedTemplate) return;
    previewMutation.mutate(selectedTemplate);
  };

  const handleDownload = () => {
    if (!selectedTemplate) return;
    downloadMutation.mutate(selectedTemplate);
  };

  const handleSystemPreview = () => {
    onUseSystemPreview?.();
    onOpenChange(false);
  };

  const handleSystemDownload = () => {
    onUseSystemDownload?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[82vh] w-[min(92vw,760px)] max-w-none flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-zinc-200 px-6 py-5 text-left dark:border-zinc-800">
          <DialogTitle>Choose PDF template</DialogTitle>
          <DialogDescription>
            Use a published custom template, or fall back to the system PDF template.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {isPending ? (
            <div className="flex min-h-60 items-center justify-center gap-3 text-sm text-zinc-500">
              <Spinner size="small" />
              Loading templates...
            </div>
          ) : hasTemplates ? (
            <div className="space-y-3 pb-3">
              {templates.map((template) => {
                const selected = template.id === selectedTemplateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={cn(
                      'w-full rounded-lg border bg-white p-4 text-left transition dark:bg-zinc-950',
                      selected
                        ? 'border-primary/60 ring-2 ring-primary/10'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
                    )}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border',
                            selected
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900'
                          )}
                        >
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                              {template.name}
                            </p>
                            {template.isDefault ? (
                              <Badge variant="secondary">Default</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Version {template.versionNumber || 1} · {template.documentType}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'mt-1 h-3 w-3 shrink-0 rounded-full border',
                          selected
                            ? 'border-primary bg-primary'
                            : 'border-zinc-300 dark:border-zinc-700'
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <Card className="flex min-h-64 flex-col items-center justify-center gap-4 border-dashed p-8 text-center shadow-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  No published template found for this document type.
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Publish a template in Settings, or continue with the system template.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings/pdf/templates')}
              >
                <Settings className="h-4 w-4" />
                Open PDF templates
              </Button>
            </Card>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {onUseSystemPreview ? (
              <Button variant="ghost" size="sm" onClick={handleSystemPreview}>
                Use system preview
              </Button>
            ) : null}
            {onUseSystemDownload ? (
              <Button variant="ghost" size="sm" onClick={handleSystemDownload}>
                Use system download
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={!selectedTemplate || isActionPending}
            >
              {previewMutation.isPending ? <Spinner size="small" /> : <Eye className="h-4 w-4" />}
              Preview
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={!selectedTemplate || isActionPending}
            >
              {downloadMutation.isPending ? (
                <Spinner size="small" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

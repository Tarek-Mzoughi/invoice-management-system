import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface TemplatePreviewPageProps {
  id: number;
}

export const TemplatePreviewPage = ({ id }: TemplatePreviewPageProps) => {
  const router = useRouter();
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  const { data: template } = useQuery({
    queryKey: ['document-template', id],
    queryFn: () => api.documentTemplate.findOne(id),
    enabled: Number.isFinite(id)
  });

  const { data: previewBlob, isPending, refetch } = useQuery({
    queryKey: ['document-template-preview', id],
    queryFn: () => api.documentTemplate.preview(id, { persist: false }),
    enabled: Number.isFinite(id)
  });

  React.useEffect(() => {
    if (!previewBlob) return;
    const url = window.URL.createObjectURL(previewBlob);
    setObjectUrl(url);
    return () => window.URL.revokeObjectURL(url);
  }, [previewBlob]);

  const download = async () => {
    try {
      await api.documentTemplate.generatePdf(id, { persist: true }, `${template?.name || 'template'}.pdf`);
    } catch {
      toast.error('Unable to generate PDF');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push(`/settings/pdf/templates/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold">{template?.name || 'Template preview'}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{template?.documentType}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button onClick={download}>
            <Download className="h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-zinc-100 p-4 dark:bg-zinc-900">
        {isPending || !objectUrl ? (
          <div className="flex h-full items-center justify-center">
            <Spinner show />
          </div>
        ) : (
          <iframe
            className="h-full w-full rounded-md border border-zinc-200 bg-white dark:border-zinc-800"
            src={`${objectUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=page-fit`}
            title={template?.name || 'Template preview'}
          />
        )}
      </div>
    </div>
  );
};

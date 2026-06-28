import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';

interface TemplatePreviewModalProps {
  open: boolean;
  loading: boolean;
  previewBlob: Blob | null;
  filename: string;
  onClose: () => void;
}

export const TemplatePreviewModal = ({
  open,
  loading,
  previewBlob,
  filename,
  onClose
}: TemplatePreviewModalProps) => (
  <DocumentPreviewDialog
    open={open}
    loading={loading}
    previewBlob={previewBlob}
    filename={filename}
    title="Template preview"
    onClose={onClose}
  />
);

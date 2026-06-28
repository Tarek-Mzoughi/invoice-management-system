import React from 'react';
import { Download, ExternalLink, File, FileImage, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PaymentUpload } from '@/types';
import { formatBytes } from '@/lib/utils';

interface PaymentAttachmentItemProps {
  attachment: PaymentUpload;
  disabled?: boolean;
  onDownload: (attachment: PaymentUpload) => void;
  onPreview: (attachment: PaymentUpload) => void;
}

const getAttachmentIcon = (mimetype?: string) => {
  if (mimetype?.startsWith('image/')) return FileImage;
  if (mimetype === 'application/pdf' || mimetype?.startsWith('text/')) return FileText;
  return File;
};

export const PaymentAttachmentItem: React.FC<PaymentAttachmentItemProps> = ({
  attachment,
  disabled,
  onDownload,
  onPreview
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const upload = attachment.upload;
  const Icon = getAttachmentIcon(upload?.mimetype);
  const createdAt = upload?.createdAt || attachment.createdAt;
  const formattedDate = createdAt ? format(parseISO(createdAt), 'dd/MM/yyyy') : '-';

  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/70">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {upload?.filename || upload?.slug || '-'}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {[upload?.mimetype, upload?.size ? formatBytes(upload.size) : undefined, formattedDate]
            .filter(Boolean)
            .join(' • ')}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-sm"
          disabled={disabled || !upload?.slug}
          onClick={() => onPreview(attachment)}
          title={tInvoicing('payment.attachments.preview')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-sm"
          disabled={disabled || !upload?.slug}
          onClick={() => onDownload(attachment)}
          title={tInvoicing('payment.attachments.download')}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

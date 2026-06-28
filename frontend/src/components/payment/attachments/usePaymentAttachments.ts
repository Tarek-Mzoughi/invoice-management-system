import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Payment, PaymentUpload } from '@/types';
import { getErrorMessage } from '@/utils/errors';

interface UsePaymentAttachmentsParams {
  open: boolean;
  payment?: Payment | null;
}

const openBlobInNewTab = (blob: Blob, filename?: string) => {
  const objectUrl = window.URL.createObjectURL(blob);
  const openedWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');

  if (!openedWindow) {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = filename || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60000);
};

const getAttachmentSlug = (attachment: PaymentUpload) => attachment.upload?.slug;

const getAttachmentFilename = (attachment: PaymentUpload) =>
  attachment.upload?.filename || attachment.upload?.slug || 'attachment';

export const usePaymentAttachments = ({ open, payment }: UsePaymentAttachmentsParams) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const paymentId = payment?.id;

  const paymentQuery = useQuery({
    queryKey: ['payment-attachments', paymentId],
    queryFn: () => api.payment.findOneForAttachments(paymentId as number),
    enabled: open && typeof paymentId === 'number'
  });

  const currentPayment = paymentQuery.data || payment || null;
  const attachments = React.useMemo(() => {
    return [...(currentPayment?.uploads || [])]
      .filter((attachment) => !!attachment.upload)
      .sort((a, b) => {
        const firstDate = a.upload?.createdAt || a.createdAt || '';
        const secondDate = b.upload?.createdAt || b.createdAt || '';
        return new Date(secondDate).getTime() - new Date(firstDate).getTime();
      });
  }, [currentPayment?.uploads]);

  const previewMutation = useMutation({
    mutationFn: async (attachment: PaymentUpload) => {
      const slug = getAttachmentSlug(attachment);
      if (!slug) throw new Error(tInvoicing('payment.attachments.preview_failure'));
      const blob = await api.upload.fetchBlobBySlug(slug);
      if (!blob) throw new Error(tInvoicing('payment.attachments.preview_failure'));
      return { blob, filename: getAttachmentFilename(attachment) };
    },
    onSuccess: ({ blob, filename }) => {
      openBlobInNewTab(blob, filename);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('payment.attachments.preview_failure'))
      );
    }
  });

  const downloadMutation = useMutation({
    mutationFn: async (attachment: PaymentUpload) => {
      const slug = getAttachmentSlug(attachment);
      if (!slug) throw new Error(tInvoicing('payment.attachments.download_failure'));
      await api.upload.downloadFile(slug, getAttachmentFilename(attachment));
    },
    onSuccess: () => {
      toast.success(tInvoicing('payment.attachments.download_success'));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('payment.attachments.download_failure'))
      );
    }
  });

  return {
    payment: currentPayment,
    attachments,
    isLoading: paymentQuery.isPending,
    isError: paymentQuery.isError,
    error: paymentQuery.error,
    refetch: paymentQuery.refetch,
    previewAttachment: previewMutation.mutate,
    downloadAttachment: downloadMutation.mutate,
    isAttachmentActionPending: previewMutation.isPending || downloadMutation.isPending
  };
};

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { downloadBlob } from '@/api/utils/document-api-factory';
import { Payment } from '@/types';
import { getErrorMessage } from '@/utils/errors';

const buildPaymentReceiptFilename = (payment?: Payment | null) => {
  const rawReference = payment?.reference?.trim() || (payment?.id ? `PAY-${payment.id}` : 'payment');
  const reference = rawReference
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `RECU-PAIEMENT-${reference || payment?.id || 'payment'}.pdf`;
};

const printPdfBlob = (blob: Blob) => {
  const objectUrl = window.URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = objectUrl;

  const cleanup = () => {
    window.URL.revokeObjectURL(objectUrl);
    iframe.remove();
  };

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(cleanup, 1000);
    }
  };

  document.body.appendChild(iframe);
};

export const usePaymentReceiptPdf = () => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const [previewFilename, setPreviewFilename] = React.useState('RECU-PAIEMENT.pdf');

  const previewMutation = useMutation({
    mutationFn: (payment: Payment) => {
      if (!payment.id) throw new Error('Payment id is required');
      return api.payment.previewReceipt(payment.id);
    },
    onMutate: (payment) => {
      setPreviewFilename(buildPaymentReceiptFilename(payment));
      setPreviewBlob(null);
      setPreviewOpen(true);
    },
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      setPreviewOpen(false);
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('payment.receipt.preview_failure'))
      );
    }
  });

  const downloadMutation = useMutation({
    mutationFn: async (payment: Payment) => {
      if (!payment.id) throw new Error('Payment id is required');
      const blob = await api.payment.downloadReceipt(payment.id);
      return { blob, payment };
    },
    onSuccess: ({ blob, payment }) => {
      downloadBlob(blob, buildPaymentReceiptFilename(payment));
      toast.success(tInvoicing('payment.receipt.download_success'));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('payment.receipt.download_failure'))
      );
    }
  });

  const printMutation = useMutation({
    mutationFn: async (payment: Payment) => {
      if (!payment.id) throw new Error('Payment id is required');
      return api.payment.previewReceipt(payment.id);
    },
    onSuccess: (blob) => {
      printPdfBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('payment.receipt.print_failure'))
      );
    }
  });

  return {
    previewOpen,
    previewBlob,
    previewFilename,
    isPreviewPending: previewMutation.isPending,
    isReceiptActionPending:
      previewMutation.isPending || downloadMutation.isPending || printMutation.isPending,
    previewReceipt: previewMutation.mutate,
    downloadReceipt: downloadMutation.mutate,
    printReceipt: printMutation.mutate,
    closePreview: () => {
      setPreviewOpen(false);
      setPreviewBlob(null);
    }
  };
};

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { downloadBlob } from '@/api/utils/document-api-factory';
import { Payment } from '@/types';
import { getErrorMessage } from '@/utils/errors';

const buildCertificateReference = (payment?: Payment | null) => {
  const date = payment?.taxWithholdingDate || payment?.date;
  const parsedDate = date ? new Date(date) : null;
  const year =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.getFullYear()
      : new Date().getFullYear();
  return `RSC-${year}-${String(payment?.id || 0).padStart(5, '0')}`;
};

const buildCertificateFilename = (payment?: Payment | null) =>
  `CERTIFICAT-RS-${buildCertificateReference(payment)}.pdf`;

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

export const useWithholdingTaxCertificatePdf = () => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const [previewFilename, setPreviewFilename] = React.useState('CERTIFICAT-RS.pdf');
  const [previewTitle, setPreviewTitle] = React.useState(
    tInvoicing('withholding_tax.preview_title', {
      reference: buildCertificateReference()
    })
  );

  const previewMutation = useMutation({
    mutationFn: (payment: Payment) => {
      if (!payment.id) throw new Error('Payment id is required');
      return api.withholdingTaxCertificate.preview(payment.id);
    },
    onMutate: (payment) => {
      const reference = buildCertificateReference(payment);
      setPreviewFilename(buildCertificateFilename(payment));
      setPreviewTitle(tInvoicing('withholding_tax.preview_title', { reference }));
      setPreviewBlob(null);
      setPreviewOpen(true);
    },
    onSuccess: (blob) => {
      setPreviewBlob(blob);
    },
    onError: (error) => {
      setPreviewOpen(false);
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('withholding_tax.preview_failure'))
      );
    }
  });

  const downloadMutation = useMutation({
    mutationFn: async (payment: Payment) => {
      if (!payment.id) throw new Error('Payment id is required');
      const blob = await api.withholdingTaxCertificate.download(payment.id);
      return { blob, payment };
    },
    onSuccess: ({ blob, payment }) => {
      downloadBlob(blob, buildCertificateFilename(payment));
      toast.success(tInvoicing('withholding_tax.download_success'));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('withholding_tax.download_failure'))
      );
    }
  });

  const printMutation = useMutation({
    mutationFn: async (payment: Payment) => {
      if (!payment.id) throw new Error('Payment id is required');
      return api.withholdingTaxCertificate.preview(payment.id);
    },
    onSuccess: (blob) => {
      printPdfBlob(blob);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('withholding_tax.print_failure'))
      );
    }
  });

  return {
    previewOpen,
    previewBlob,
    previewFilename,
    previewTitle,
    isPreviewPending: previewMutation.isPending,
    isActionPending:
      previewMutation.isPending || downloadMutation.isPending || printMutation.isPending,
    previewCertificate: previewMutation.mutate,
    downloadCertificate: downloadMutation.mutate,
    printCertificate: printMutation.mutate,
    closePreview: () => {
      setPreviewOpen(false);
      setPreviewBlob(null);
    }
  };
};

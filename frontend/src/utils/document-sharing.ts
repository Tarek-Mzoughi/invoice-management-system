import { downloadBlob } from '@/api/utils/document-api-factory';

interface ShareDocumentOptions {
  blob: Blob;
  filename: string;
  title: string;
  text: string;
}

interface MailtoOptions {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

export const createPdfFile = (blob: Blob, filename: string) => {
  return new File([blob], filename, { type: 'application/pdf' });
};

export const canShareFiles = (files: File[]) => {
  return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files });
};

export const shareDocumentFile = async ({ blob, filename, title, text }: ShareDocumentOptions) => {
  const file = createPdfFile(blob, filename);

  if (!canShareFiles([file])) {
    return false;
  }

  await navigator.share({
    title,
    text,
    files: [file]
  });

  return true;
};

export const downloadDocumentBlob = (blob: Blob, filename: string) => {
  downloadBlob(blob, filename);
};

export const openMailComposer = ({ to, cc, subject, body }: MailtoOptions) => {
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);

  if (cc?.trim()) {
    params.set('cc', cc.trim());
  }

  window.location.href = `mailto:${encodeURIComponent(to.trim())}?${params.toString()}`;
};

export const normalizeWhatsAppPhone = (phone?: string) => {
  return (phone || '').replace(/\D/g, '');
};

export const openWhatsAppComposer = (phone: string, message: string) => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  const url = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  window.open(url, '_blank', 'noopener,noreferrer');
};

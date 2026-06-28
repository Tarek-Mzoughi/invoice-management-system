import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Paperclip,
  Loader2,
  Save,
  X,
  Upload,
  Eye,
  FileText,
  X as XIcon,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { INVOICE_STATUS, Invoice, InvoiceUploadedFile } from '@/types';
import { toast } from 'sonner';
import { api } from '@/api';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Dropzone from 'react-dropzone';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';

interface InvoiceAttachmentDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  scope?: 'selling' | 'buying';
}

export const InvoiceAttachmentDialog: React.FC<InvoiceAttachmentDialogProps> = ({
  open,
  onClose,
  invoice,
  scope
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const invoiceLabels = useSellingInvoiceLabels({ scope });

  const [files, setFiles] = React.useState<File[]>([]);
  const [initialUploads, setInitialUploads] = React.useState<InvoiceUploadedFile[]>([]);
  const [previewFile, setPreviewFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');

  const { data: fullInvoice, isLoading } = useQuery({
    queryKey: ['invoice-details', invoice?.id],
    queryFn: () => api.invoice.findOne(invoice!.id!),
    enabled: open && !!invoice?.id
  });

  React.useEffect(() => {
    if (fullInvoice && fullInvoice.uploads) {
      const uploads = fullInvoice.uploads.map((u) => ({
        upload: u,
        file: u.upload ? new File([], u.upload.filename || '') : undefined
      })) as InvoiceUploadedFile[];

      setInitialUploads(uploads);
      // We don't have the actual File objects for existing uploads, but we can represent them
      setFiles(uploads.map((u) => u.file).filter((f): f is File => !!f));
    } else {
      setFiles([]);
      setInitialUploads([]);
    }
  }, [fullInvoice, open]);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const { mutate: updateInvoiceFiles, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedFiles: File[]) => {
      if (!fullInvoice) return;

      const keptUploads = initialUploads.filter(
        (u) => u.upload?.upload && updatedFiles.some((f) => f.name === u.upload?.upload?.filename)
      );

      const newFiles = updatedFiles.filter(
        (f) => !initialUploads.some((u) => u.upload?.upload?.filename === f.name)
      );

      const articlesDto = fullInvoice.articleInvoiceEntries?.map((article: any) => ({
        article: {
          title: article?.article?.title,
          description: article?.article?.description
        },
        quantity: article?.quantity || 0,
        unit_price: article?.unit_price || 0,
        discount: article?.discount || 0,
        discount_type: article?.discount_type,
        taxes:
          article?.articleInvoiceEntryTaxes?.map((entry: any) => entry?.tax?.id || entry?.taxId) ||
          []
      }));

      const payload: any = {
        ...fullInvoice,
        firmId: fullInvoice.firmId || fullInvoice.firm?.id,
        interlocutorId: fullInvoice.interlocutorId || fullInvoice.interlocutor?.id,
        currencyId: fullInvoice.currencyId || fullInvoice.currency?.id,
        bankAccountId: fullInvoice.bankAccountId || fullInvoice.bankAccount?.id,
        articleInvoiceEntries: articlesDto,
        uploads: keptUploads.map((u) => u.upload)
      };

      // Remove complex objects to avoid mapping issues in backend
      delete payload.firm;
      delete payload.interlocutor;
      delete payload.currency;
      delete payload.bankAccount;
      delete payload.payments;

      return api.invoice.update(payload, newFiles);
    },
    onSuccess: () => {
      toast.success(tCommon('files.attachments.update_success'));
      onClose();
    },
    onError: (error: any) => {
      toast.error(tCommon('files.attachments.update_failure'));
    }
  });

  const handleSave = () => {
    updateInvoiceFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getMimeType = (file: File): string => {
    if (file.type && file.type !== 'application/octet-stream') return file.type;
    const ext = file.name?.split('.').pop()?.toLowerCase() || '';
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml'
    };
    return mimeMap[ext] || 'application/octet-stream';
  };

  const handleViewFile = (file: File) => {
    // If it's an existing file, we might need to download it first or use its slug
    // For now, assume it's a new file or we have the Blob
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const correctMime = getMimeType(file);
    const blob = new Blob([file], { type: correctMime });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPreviewFile(file);
  };

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl('');
  };

  const handleDownloadFile = () => {
    if (!previewFile || !previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = previewFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    }
  }, []);

  const isPending = isLoading || isUpdating;

  const hasChanges = React.useMemo(() => {
    if (isLoading) return false;
    const initialFiles = initialUploads.map((u) => u.upload?.upload?.filename).filter(Boolean);
    if (files.length !== initialFiles.length) return true;
    return files.some((f) => !initialFiles.includes(f.name));
  }, [files, initialUploads, isLoading]);

  const getStatusBadgeClassName = (status?: INVOICE_STATUS) => {
    switch (status) {
      case INVOICE_STATUS.Paid:
        return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case INVOICE_STATUS.PartiallyPaid:
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case INVOICE_STATUS.Settled:
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case INVOICE_STATUS.PartiallySettled:
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case INVOICE_STATUS.Unpaid:
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case INVOICE_STATUS.Draft:
        return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      default:
        return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200';
    }
  };

  const isPdfFile = (file: File) => {
    const ext = file.name?.split('.').pop()?.toLowerCase() || '';
    return file.type === 'application/pdf' || ext === 'pdf';
  };

  const isImageFile = (file: File) => {
    const ext = file.name?.split('.').pop()?.toLowerCase() || '';
    return (
      file.type.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
    );
  };

  const getFileIcon = (file: File) => {
    if (isImageFile(file)) {
      return <ImageIcon className="h-4 w-4 text-zinc-400 flex-shrink-0" />;
    }
    return <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" />;
  };

  const displayInvoice = fullInvoice || invoice;
  const digitAfterComma = displayInvoice?.currency?.digitAfterComma || 3;
  const currencySymbol = displayInvoice?.currency?.symbol || 'DT';

  return (
    <>
      <Sheet open={open} onOpenChange={(val) => !isPending && onClose()}>
        <SheetContent
          hideClose
          className="sm:max-w-[600px] p-0 flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl rounded-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
            <SheetTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Gérer les pièces jointes
            </SheetTitle>
            <SheetDescription className="sr-only">
              {`Gérer les pièces jointes de la ${invoiceLabels.singular.toLowerCase()}`}
            </SheetDescription>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium"
                onClick={handleSave}
                disabled={isPending || !hasChanges}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 rounded-none gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                disabled={isPending}
              >
                <X className="h-4 w-4 text-zinc-500" /> Fermer
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="flex flex-col gap-6 w-full">
              <div className="flex items-start justify-between w-full">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-medium">Document</p>
                  <p className="text-sm font-semibold">
                    {invoiceLabels.displayNumber(displayInvoice)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-2.5 py-0.5 rounded-none',
                    getStatusBadgeClassName(displayInvoice?.status)
                  )}
                >
                  {displayInvoice?.status ? tInvoicing(displayInvoice.status) : 'Brouillon'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-medium">
                    {invoiceLabels.isBuying
                      ? tInvoicing('invoice.attributes.supplier')
                      : tInvoicing('invoice.attributes.customer')}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {displayInvoice?.firm?.name || invoiceLabels.partnerFallback}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-medium">Date</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {displayInvoice?.date
                      ? format(parseISO(displayInvoice.date), 'dd MMMM, yyyy HH:mm', { locale: fr })
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Total</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {displayInvoice?.total !== undefined
                    ? `${displayInvoice.total.toLocaleString('fr-FR', { minimumFractionDigits: digitAfterComma, maximumFractionDigits: digitAfterComma })} ${currencySymbol}`
                    : '-'}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
              ) : (
                <>
                  <Dropzone
                    onDrop={onDrop}
                    accept={{
                      'image/*': [],
                      'application/pdf': [],
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
                      'application/msword': [],
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
                      'application/vnd.ms-excel': []
                    }}
                    maxSize={1024 * 1024 * 50}
                    multiple
                  >
                    {({ getRootProps, getInputProps, isDragActive }) => (
                      <div
                        {...getRootProps()}
                        className={cn(
                          'flex items-center gap-4 px-5 py-5 rounded-none border-2 border-dashed cursor-pointer transition-all duration-200',
                          'border-zinc-300 dark:border-zinc-600 hover:border-primary/60 dark:hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/5',
                          isDragActive &&
                            'border-primary bg-primary/10 dark:border-primary dark:bg-primary/10'
                        )}
                      >
                        <input {...getInputProps()} />
                        <div className="flex-shrink-0 w-10 h-10 rounded-none bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            Cliquez pour télécharger vos fichiers
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            Max 10 fichiers • PDF, JPEG, JPG, PNG
                          </p>
                        </div>
                      </div>
                    )}
                  </Dropzone>

                  {files.length > 0 && (
                    <div className="border border-zinc-200 dark:border-zinc-700 rounded-none divide-y divide-zinc-100 dark:divide-zinc-800">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group"
                        >
                          {getFileIcon(file)}
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 truncate">
                            {file.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleViewFile(file)}
                              className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                              title="Voir le fichier"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Supprimer"
                            >
                              <XIcon className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!previewFile} onOpenChange={(val) => !val && handleClosePreview()}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden rounded-none [&>button]:hidden">
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate pr-4">
                {previewFile?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Prévisualisation du fichier {previewFile?.name}
              </DialogDescription>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-none gap-2"
                  onClick={handleDownloadFile}
                >
                  <Download className="h-4 w-4" /> Télécharger
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-none gap-2"
                  onClick={handleClosePreview}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            {previewFile && previewUrl && (
              <>
                {isPdfFile(previewFile) ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title={previewFile.name}
                  />
                ) : isImageFile(previewFile) ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img
                      src={previewUrl}
                      alt={previewFile.name}
                      className="max-w-full max-h-full object-contain shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-500">
                    <FileText className="h-16 w-16" />
                    <p className="text-sm">Aperçu non disponible pour ce type de fichier</p>
                    <Button variant="outline" onClick={handleDownloadFile} className="gap-2">
                      <Download className="h-4 w-4" /> Télécharger le fichier
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

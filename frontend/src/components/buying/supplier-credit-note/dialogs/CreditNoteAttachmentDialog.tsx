import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
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
import {
  ACTIVITY_TYPE,
  CREDIT_NOTE_STATUS,
  CreditNote,
  CreditNoteUploadedFile,
  UpdateCreditNoteDto
} from '@/types';
import { toast } from 'sonner';
import { api } from '@/api';
import { cn } from '@/lib/utils';
import Dropzone from 'react-dropzone';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
interface CreditNoteAttachmentDialogProps {
  open: boolean;
  onClose: () => void;
  creditNote: CreditNote | null;
  onSaved?: () => void | Promise<void>;
  scope?: 'selling' | 'buying';
}
const getStatusBadgeClassName = (status?: CREDIT_NOTE_STATUS) => {
  switch (status) {
    case CREDIT_NOTE_STATUS.Paid:
      return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case CREDIT_NOTE_STATUS.PartiallyPaid:
      return 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case CREDIT_NOTE_STATUS.Unpaid:
      return 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    case CREDIT_NOTE_STATUS.Expired:
      return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    case CREDIT_NOTE_STATUS.Draft:
    default:
      return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  }
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
    svg: 'image/svg+xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return mimeMap[ext] || 'application/octet-stream';
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
export const CreditNoteAttachmentDialog: React.FC<CreditNoteAttachmentDialogProps> = ({
  open,
  onClose,
  creditNote,
  onSaved,
  scope
}) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const documentLabels = useScopedDocumentLabels('creditNote', scope);
  const dateLocale = router.locale === 'fr' ? fr : enUS;
  const numberLocale = router.locale === 'fr' ? 'fr-FR' : 'en-US';
  const [files, setFiles] = React.useState<File[]>([]);
  const [initialUploads, setInitialUploads] = React.useState<CreditNoteUploadedFile[]>([]);
  const [previewFile, setPreviewFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const { data: fullCreditNote, isLoading } = useQuery({
    queryKey: ['credit-note-details', creditNote?.id],
    queryFn: () => api.creditNote.findOne(creditNote!.id!),
    enabled: open && !!creditNote?.id
  });
  React.useEffect(() => {
    if (fullCreditNote?.files) {
      setInitialUploads(fullCreditNote.files);
      setFiles(
        fullCreditNote.files.map((upload) => upload.file).filter((file): file is File => !!file)
      );
    } else {
      setFiles([]);
      setInitialUploads([]);
    }
  }, [fullCreditNote, open]);
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const { mutate: updateCreditNoteFiles, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedFiles: File[]) => {
      if (!fullCreditNote) {
        throw new Error('Credit note not loaded');
      }
      const keptUploads = initialUploads.filter(
        (upload) =>
          upload.file &&
          updatedFiles.some(
            (file) => file.name === upload.file!.name && file.size === upload.file!.size
          )
      );
      const newFiles = updatedFiles.filter(
        (file) =>
          !initialUploads.some(
            (upload) => upload.file?.name === file.name && upload.file?.size === file.size
          )
      );
      const articleCreditNoteEntries = fullCreditNote.articleCreditNoteEntries?.map((article) => ({
        article: {
          title: article?.article?.title,
          description: article?.article?.description
        },
        quantity: article?.quantity || 0,
        unit_price: article?.unit_price || 0,
        discount: article?.discount || 0,
        discount_type: article?.discount_type,
        taxes:
          article?.articleCreditNoteEntryTaxes
            ?.map((entry) => entry?.tax?.id || entry?.taxId)
            .filter((taxId): taxId is number => typeof taxId === 'number') || []
      }));
      const payload: Record<string, unknown> = {
        ...fullCreditNote,
        firmId: fullCreditNote.firmId || fullCreditNote.firm?.id,
        interlocutorId: fullCreditNote.interlocutorId || fullCreditNote.interlocutor?.id,
        currencyId: fullCreditNote.currencyId || fullCreditNote.currency?.id,
        bankAccountId: fullCreditNote.bankAccountId || fullCreditNote.bankAccount?.id,
        articleCreditNoteEntries,
        uploads: keptUploads.map((upload) => upload.upload)
      };
      delete payload.files;
      delete payload.firm;
      delete payload.interlocutor;
      delete payload.currency;
      delete payload.bankAccount;
      delete payload.cabinet;
      delete payload.sourceInvoice;
      delete payload.sourceReturnNote;
      delete payload.quotation;
      delete payload.deliveryNote;
      delete payload.goodsIssueNote;
      delete payload.payments;
      return api.creditNote.update(payload as UpdateCreditNoteDto, newFiles);
    },
    onSuccess: async () => {
      toast.success(tInvoicing('creditNote.attachments.update_success'));
      await onSaved?.();
      onClose();
    },
    onError: () => {
      toast.error(tInvoicing('creditNote.attachments.update_failure'));
    }
  });
  const handleSave = () => {
    updateCreditNoteFiles(files);
  };
  const handleRemoveFile = (index: number) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };
  const handleViewFile = (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const blob = new Blob([file], { type: getMimeType(file) });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPreviewFile(file);
  };
  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl('');
  };
  const handleDownloadFile = () => {
    if (!previewFile || !previewUrl) return;
    const anchor = document.createElement('a');
    anchor.href = previewUrl;
    anchor.download = previewFile.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles((current) => [...current, ...acceptedFiles]);
    }
  }, []);
  const isPending = isLoading || isUpdating;
  const hasChanges = React.useMemo(() => {
    if (isLoading) return false;
    const originalFiles = initialUploads
      .map((upload) => upload.file)
      .filter((file): file is File => !!file);
    if (files.length !== originalFiles.length) return true;
    return files.some((file, index) => {
      const originalFile = originalFiles[index];
      return !originalFile || file.name !== originalFile.name || file.size !== originalFile.size;
    });
  }, [files, initialUploads, isLoading]);
  const displayCreditNote = fullCreditNote || creditNote;
  const partnerLabel = tInvoicing('creditNote.attributes.supplier');
  const partnerName = displayCreditNote?.firm?.name || documentLabels.partnerFallback;
  const digitAfterComma = displayCreditNote?.currency?.digitAfterComma || 3;
  const currencySymbol = displayCreditNote?.currency?.symbol || '';
  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isPending) {
            onClose();
          }
        }}
      >
        <SheetContent
          hideClose
          className="flex h-full flex-col rounded-none border-l border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[600px]"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-900">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <Paperclip className="h-4 w-4" />
              {tInvoicing('creditNote.attachments.title')}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {tInvoicing('creditNote.attachments.description')}
            </SheetDescription>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 gap-2 rounded-none font-medium"
                onClick={handleSave}
                disabled={isPending || !hasChanges}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {tCommon('commands.save')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 gap-2 rounded-none border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                disabled={isPending}
              >
                <X className="h-4 w-4 text-zinc-500" /> {tCommon('commands.close')}
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="flex w-full flex-col gap-6">
              <div className="flex w-full items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-500">{documentLabels.document}</p>
                  <p className="text-sm font-semibold">
                    {documentLabels.displayNumber(displayCreditNote)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-none px-2.5 py-0.5 text-xs',
                    getStatusBadgeClassName(displayCreditNote?.status)
                  )}
                >
                  {displayCreditNote?.status
                    ? tInvoicing(displayCreditNote.status)
                    : tInvoicing(CREDIT_NOTE_STATUS.Draft)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-500">{partnerLabel}</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {partnerName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-500">
                    {tInvoicing('creditNote.attributes.date')}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {displayCreditNote?.date
                      ? format(parseISO(displayCreditNote.date), 'dd MMMM, yyyy HH:mm', {
                          locale: dateLocale
                        })
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500">
                  {tInvoicing('creditNote.attributes.total')}
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {displayCreditNote?.total !== undefined
                    ? `${Number(displayCreditNote.total).toLocaleString(numberLocale, {
                        minimumFractionDigits: digitAfterComma,
                        maximumFractionDigits: digitAfterComma
                      })} ${currencySymbol}`.trim()
                    : '-'}
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
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
                          'flex cursor-pointer items-center gap-4 rounded-none border-2 border-dashed px-5 py-5 transition-all duration-200',
                          'border-zinc-300 hover:border-primary/60 hover:bg-primary/5 dark:border-zinc-600 dark:hover:border-primary/60 dark:hover:bg-primary/5',
                          isDragActive &&
                            'border-primary bg-primary/10 dark:border-primary dark:bg-primary/10'
                        )}
                      >
                        <input {...getInputProps()} />
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-none bg-primary/10 dark:bg-primary/20">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {tInvoicing('creditNote.attachments.dropzone_title')}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {tInvoicing('creditNote.attachments.dropzone_hint')}
                          </p>
                        </div>
                      </div>
                    )}
                  </Dropzone>

                  <div className="space-y-3">
                    {files.length > 0 ? (
                      <div className="divide-y divide-zinc-100 rounded-none border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          >
                            {isImageFile(file) ? (
                              <ImageIcon className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                            ) : (
                              <FileText className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                            )}
                            <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                              {file.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleViewFile(file)}
                                className="rounded-md p-1.5 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                title={tInvoicing('creditNote.details.view_linked_document')}
                              >
                                <Eye className="h-4 w-4 text-primary" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="rounded-md p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                                title={tCommon('commands.delete')}
                              >
                                <XIcon className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-none border border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        {tInvoicing('creditNote.attachments.empty')}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!previewFile} onOpenChange={(isOpen) => !isOpen && handleClosePreview()}>
        <DialogContent className="flex h-[85vh] w-[90vw] max-w-4xl flex-col overflow-hidden rounded-none bg-white p-0 dark:bg-zinc-950 [&>button]:hidden">
          <DialogHeader className="flex-shrink-0 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <DialogTitle className="pr-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {previewFile?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {tInvoicing('creditNote.attachments.description')}
              </DialogDescription>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-none"
                  onClick={handleDownloadFile}
                >
                  <Download className="h-4 w-4" /> {tCommon('commands.download')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-none"
                  onClick={handleClosePreview}
                >
                  {tCommon('commands.close')}
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
                    className="h-full w-full border-0"
                    title={previewFile.name}
                  />
                ) : isImageFile(previewFile) ? (
                  <div className="flex h-full w-full items-center justify-center p-4">
                    <img
                      src={previewUrl}
                      alt={previewFile.name}
                      className="max-h-full max-w-full object-contain shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-zinc-500">
                    <FileText className="h-16 w-16" />
                    <p className="text-sm">
                      {tInvoicing('creditNote.attachments.preview_unavailable')}
                    </p>
                    <Button variant="outline" onClick={handleDownloadFile} className="gap-2">
                      <Download className="h-4 w-4" /> {tCommon('commands.download')}
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

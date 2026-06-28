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
  GOODS_ISSUE_NOTE_STATUS,
  GoodsIssueNote,
  GoodsIssueNoteUploadedFile,
  UpdateGoodsIssueNoteDto
} from '@/types';
import { toast } from 'sonner';
import { api } from '@/api';
import { cn } from '@/lib/utils';
import Dropzone from 'react-dropzone';
interface GoodsIssueNoteAttachmentDialogProps {
  open: boolean;
  onClose: () => void;
  goodsIssueNote: GoodsIssueNote | null;
  onSaved?: () => void | Promise<void>;
}
const getStatusBadgeClassName = (status?: GOODS_ISSUE_NOTE_STATUS) => {
  switch (status) {
    case GOODS_ISSUE_NOTE_STATUS.Issued:
      return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case GOODS_ISSUE_NOTE_STATUS.Created:
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case GOODS_ISSUE_NOTE_STATUS.Cancelled:
      return 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case GOODS_ISSUE_NOTE_STATUS.Draft:
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
const getFileIcon = (file: File) => {
  if (isImageFile(file)) {
    return <ImageIcon className="h-4 w-4 text-zinc-400 flex-shrink-0" />;
  }
  return <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" />;
};
export const GoodsIssueNoteAttachmentDialog: React.FC<GoodsIssueNoteAttachmentDialogProps> = ({
  open,
  onClose,
  goodsIssueNote,
  onSaved
}) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const dateLocale = router.locale === 'fr' ? fr : enUS;
  const numberLocale = router.locale === 'fr' ? 'fr-FR' : 'en-US';
  const [files, setFiles] = React.useState<File[]>([]);
  const [initialUploads, setInitialUploads] = React.useState<GoodsIssueNoteUploadedFile[]>([]);
  const [previewFile, setPreviewFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const { data: fullGoodsIssueNote, isLoading } = useQuery({
    queryKey: ['goodsIssueNote-details', goodsIssueNote?.id],
    queryFn: () => api.goodsIssueNote.findOne(goodsIssueNote!.id!),
    enabled: open && !!goodsIssueNote?.id
  });
  React.useEffect(() => {
    if (fullGoodsIssueNote?.files) {
      setInitialUploads(fullGoodsIssueNote.files);
      setFiles(
        fullGoodsIssueNote.files.map((upload) => upload.file).filter((file): file is File => !!file)
      );
    } else {
      setFiles([]);
      setInitialUploads([]);
    }
  }, [fullGoodsIssueNote, open]);
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const { mutate: updateGoodsIssueNoteFiles, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedFiles: File[]) => {
      if (!fullGoodsIssueNote) {
        throw new Error('Goods issue note not loaded');
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
      const articleGoodsIssueNoteEntries = fullGoodsIssueNote.articleGoodsIssueNoteEntries?.map(
        (article) => ({
          article: {
            title: article?.article?.title,
            description: article?.article?.description
          },
          quantity: article?.quantity || 0,
          unit_price: article?.unit_price || 0,
          discount: article?.discount || 0,
          discount_type: article?.discount_type,
          taxes:
            article?.articleGoodsIssueNoteEntryTaxes
              ?.map((entry) => entry?.tax?.id || entry?.taxId)
              .filter((taxId): taxId is number => typeof taxId === 'number') || []
        })
      );
      const payload: Record<string, unknown> = {
        ...fullGoodsIssueNote,
        firmId: fullGoodsIssueNote.firmId || fullGoodsIssueNote.firm?.id,
        interlocutorId: fullGoodsIssueNote.interlocutorId || fullGoodsIssueNote.interlocutor?.id,
        currencyId: fullGoodsIssueNote.currencyId || fullGoodsIssueNote.currency?.id,
        bankAccountId: fullGoodsIssueNote.bankAccountId || fullGoodsIssueNote.bankAccount?.id,
        articleGoodsIssueNoteEntries,
        uploads: keptUploads.map((upload) => upload.upload)
      };
      delete payload.files;
      delete payload.firm;
      delete payload.interlocutor;
      delete payload.currency;
      delete payload.bankAccount;
      delete payload.cabinet;
      delete payload.invoices;
      return api.goodsIssueNote.update(payload as UpdateGoodsIssueNoteDto, newFiles);
    },
    onSuccess: async () => {
      toast.success(
        tInvoicing('goodsIssueNote.attachments.update_success', {
          defaultValue: 'Pièces jointes mises à jour avec succès'
        })
      );
      await onSaved?.();
      onClose();
    },
    onError: () => {
      toast.error(
        tInvoicing('goodsIssueNote.attachments.update_failure', {
          defaultValue: 'Erreur lors de la mise à jour des pièces jointes'
        })
      );
    }
  });
  const handleSave = () => {
    updateGoodsIssueNoteFiles(files);
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
  const displayDoc = fullGoodsIssueNote || goodsIssueNote;
  const partnerName =
    displayDoc?.firm?.name ||
    tInvoicing('goodsIssueNote.details.walk_in_customer', {
      defaultValue: 'Client passager'
    });
  const digitAfterComma = displayDoc?.currency?.digitAfterComma || 3;
  const currencySymbol = displayDoc?.currency?.symbol || 'DT';
  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && !isPending && onClose()}>
        <SheetContent
          hideClose
          className="sm:max-w-[600px] p-0 flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl rounded-none"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
            <SheetTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              {tInvoicing('goodsIssueNote.attachments.title', {
                defaultValue: 'Gérer les pièces jointes'
              })}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {tInvoicing('goodsIssueNote.attachments.description', {
                defaultValue: 'Gérer les pièces jointes du bon de sortie'
              })}
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
                {tCommon('commands.save', { defaultValue: 'Enregistrer' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 rounded-none gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                disabled={isPending}
              >
                <X className="h-4 w-4 text-zinc-500" />
                {tCommon('commands.close', { defaultValue: 'Fermer' })}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="flex flex-col gap-6 w-full">
              <div className="flex items-start justify-between w-full gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-medium">
                    {tInvoicing('goodsIssueNote.document', { defaultValue: 'BON DE SORTIE' })}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {displayDoc?.sequential || '-'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-2.5 py-0.5 rounded-none',
                    getStatusBadgeClassName(displayDoc?.status)
                  )}
                >
                  {displayDoc?.status
                    ? tInvoicing(displayDoc.status)
                    : tInvoicing('goodsIssueNote.status.draft', { defaultValue: 'Brouillon' })}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-medium">
                    {tInvoicing('goodsIssueNote.attributes.customer')}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {partnerName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-medium">
                    {tInvoicing('goodsIssueNote.attributes.date')}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {displayDoc?.date
                      ? format(parseISO(displayDoc.date), 'dd MMMM, yyyy HH:mm', {
                          locale: dateLocale
                        })
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">
                  {tInvoicing('goodsIssueNote.attributes.total')}
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {displayDoc?.total !== undefined
                    ? `${Number(displayDoc.total).toLocaleString(numberLocale, {
                        minimumFractionDigits: digitAfterComma,
                        maximumFractionDigits: digitAfterComma
                      })} ${currencySymbol}`
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
                    disabled={isPending}
                  >
                    {({ getRootProps, getInputProps, isDragActive }) => (
                      <div
                        {...getRootProps()}
                        className={cn(
                          'flex items-center gap-4 px-5 py-5 rounded-none border-2 border-dashed cursor-pointer transition-all duration-200',
                          'border-zinc-300 dark:border-zinc-600 hover:border-primary/60 dark:hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/5',
                          isDragActive &&
                            'border-primary bg-primary/10 dark:border-primary dark:bg-primary/10',
                          isPending && 'pointer-events-none opacity-70'
                        )}
                      >
                        <input {...getInputProps()} />
                        <div className="flex-shrink-0 w-10 h-10 rounded-none bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {tInvoicing('goodsIssueNote.attachments.dropzone_title', {
                              defaultValue: 'Cliquez pour télécharger vos fichiers'
                            })}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            {tInvoicing('goodsIssueNote.attachments.dropzone_hint', {
                              defaultValue: 'Max 10 fichiers • PDF, JPEG, JPG, PNG'
                            })}
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
                              title={tCommon('commands.preview', {
                                defaultValue: 'Voir le fichier'
                              })}
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title={tCommon('commands.delete', { defaultValue: 'Supprimer' })}
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

      <Dialog open={!!previewFile} onOpenChange={(nextOpen) => !nextOpen && handleClosePreview()}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden rounded-none [&>button]:hidden">
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate pr-4">
                {previewFile?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {tInvoicing('goodsIssueNote.attachments.preview_title', {
                  defaultValue: `Prévisualisation du fichier ${previewFile?.name || ''}`
                })}
              </DialogDescription>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-none gap-2"
                  onClick={handleDownloadFile}
                >
                  <Download className="h-4 w-4" />
                  {tCommon('commands.download', { defaultValue: 'Télécharger' })}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-none gap-2"
                  onClick={handleClosePreview}
                >
                  {tCommon('commands.close', { defaultValue: 'Fermer' })}
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
                    <p className="text-sm">
                      {tInvoicing('goodsIssueNote.attachments.preview_unavailable', {
                        defaultValue: 'Aperçu non disponible pour ce type de fichier'
                      })}
                    </p>
                    <Button variant="outline" onClick={handleDownloadFile} className="gap-2">
                      <Download className="h-4 w-4" />
                      {tCommon('commands.download', { defaultValue: 'Télécharger le fichier' })}
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

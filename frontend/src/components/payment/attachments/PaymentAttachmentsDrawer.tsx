import React from 'react';
import { AlertCircle, Paperclip, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/shared/Spinner';
import { Payment } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { PaymentAttachmentItem } from './PaymentAttachmentItem';
import { PaymentAttachmentSummaryCard } from './PaymentAttachmentSummaryCard';
import { usePaymentAttachments } from './usePaymentAttachments';

interface PaymentAttachmentsDrawerProps {
  open: boolean;
  payment?: Payment | null;
  receiptActionPending?: boolean;
  scope?: 'selling' | 'buying';
  onDownloadReceipt?: (payment: Payment) => void;
  onOpenChange: (open: boolean) => void;
  onPreviewReceipt?: (payment: Payment) => void;
}

export const PaymentAttachmentsDrawer: React.FC<PaymentAttachmentsDrawerProps> = ({
  open,
  payment,
  receiptActionPending,
  scope,
  onDownloadReceipt,
  onOpenChange,
  onPreviewReceipt
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const {
    payment: detailedPayment,
    attachments,
    isLoading,
    isError,
    error,
    refetch,
    previewAttachment,
    downloadAttachment,
    isAttachmentActionPending
  } = usePaymentAttachments({ open, payment });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]"
      >
        <SheetHeader className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Paperclip className="mt-0.5 h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-200" />
              <div className="min-w-0">
                <SheetTitle className="truncate text-base">
                  {tInvoicing('payment.attachments.title')}
                </SheetTitle>
                <SheetDescription className="mt-2 truncate text-sm">
                  {detailedPayment?.reference ||
                    (detailedPayment?.id ? `PAY-${detailedPayment.id}` : '')}
                </SheetDescription>
              </div>
            </div>
            <SheetClose asChild>
              <Button type="button" variant="outline" size="sm" className="shrink-0">
                <X className="h-4 w-4" />
                {tInvoicing('payment.attachments.close')}
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 px-6 py-5">
            <PaymentAttachmentSummaryCard
              payment={detailedPayment}
              scope={scope}
              receiptActionPending={receiptActionPending}
              onPreviewReceipt={onPreviewReceipt}
              onDownloadReceipt={onDownloadReceipt}
            />

            <Card className="rounded-md shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                  <CardTitle className="text-base">
                    {tInvoicing('payment.attachments.files_title')}
                  </CardTitle>
                </div>
                <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                  {attachments.length}
                </span>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center">
                    <Spinner size="small" />
                  </div>
                ) : isError ? (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="space-y-3">
                        <p>
                          {getErrorMessage(
                            'invoicing',
                            error || new Error(tInvoicing('payment.attachments.load_failure')),
                            tInvoicing('payment.attachments.load_failure')
                          )}
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                          {tInvoicing('payment.attachments.retry')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <PaymentAttachmentItem
                        key={attachment.id || attachment.uploadId || attachment.upload?.slug}
                        attachment={attachment}
                        disabled={isAttachmentActionPending}
                        onPreview={previewAttachment}
                        onDownload={downloadAttachment}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                      <Paperclip className="h-9 w-9" />
                    </div>
                    <p className="mt-5 text-base font-medium text-zinc-700 dark:text-zinc-200">
                      {tInvoicing('payment.attachments.empty_title')}
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                      {tInvoicing('payment.attachments.empty_description')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

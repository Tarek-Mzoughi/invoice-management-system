import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Invoice } from '@/types';
import { toast } from 'sonner';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import { api } from '@/api';
import {
  downloadDocumentBlob,
  openWhatsAppComposer
} from '@/utils/document-sharing';

interface InvoiceWhatsAppDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  scope?: 'selling' | 'buying';
}

export const InvoiceWhatsAppDialog: React.FC<InvoiceWhatsAppDialogProps> = ({
  open,
  onClose,
  invoice,
  scope
}) => {
  const invoiceLabels = useSellingInvoiceLabels({ scope });
  const [phone, setPhone] = React.useState<string | undefined>('');
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    if (invoice && open) {
      setPhone(invoice.interlocutor?.phone || '');
    }
  }, [invoice, open]);

  const handleSend = async () => {
    if (!invoice?.id) {
      toast.error('Document introuvable.');
      return;
    }

    const reference = invoiceLabels.displayNumber(invoice);
    const filename = `${reference || `invoice-${invoice.id}`}.pdf`;
    const message =
      `Bonjour ${supplierName},\n\n` +
      `Veuillez trouver le document ${reference} en piece jointe.\n\n` +
      'Cordialement.';

    setIsSending(true);
    try {
      const blob = await api.invoice.preview(invoice.id, 'template1');
      downloadDocumentBlob(blob, filename);
      openWhatsAppComposer(phone || '', `${message}\n\nLe PDF a ete telecharge sur votre appareil. Ajoutez-le a la conversation avant l'envoi.`);

      toast.success('Document prepare pour envoi WhatsApp.');
      onClose();
    } catch {
      toast.error("Impossible de preparer le document pour WhatsApp.");
    } finally {
      setIsSending(false);
    }
  };

  const supplierName = invoice?.firm?.name || invoiceLabels.partnerFallback;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[600px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl">
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-green-500" />
            <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Envoyer par WhatsApp
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Saisir le numéro de téléphone de{' '}
            <span className="text-zinc-900 dark:text-zinc-100 font-bold">{supplierName}</span>
          </p>

          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Numéro de téléphone
            </Label>
            <PhoneInput
              id="phone"
              value={phone as any}
              onChange={(v) => setPhone(v)}
              className="h-11 shadow-sm"
              defaultCountry="TN"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900">
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-[100px] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Retour
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="min-w-[100px]"
          >
            {isSending ? 'Preparation...' : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

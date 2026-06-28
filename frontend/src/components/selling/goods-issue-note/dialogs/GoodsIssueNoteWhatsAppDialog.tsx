import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';
import { GoodsIssueNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { api } from '@/api';
import { downloadDocumentBlob, openWhatsAppComposer } from '@/utils/document-sharing';

interface GoodsIssueNoteWhatsAppDialogProps {
  open: boolean;
  onClose: () => void;
  goodsIssueNote: GoodsIssueNote | null;
}

export const GoodsIssueNoteWhatsAppDialog: React.FC<GoodsIssueNoteWhatsAppDialogProps> = ({
  open,
  onClose,
  goodsIssueNote
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const [phone, setPhone] = React.useState<string | undefined>('');
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    if (goodsIssueNote && open) {
      setPhone(goodsIssueNote.interlocutor?.phone || '');
    }
  }, [goodsIssueNote, open]);

  const handleSend = async () => {
    if (!goodsIssueNote?.id) {
      toast.error('Document introuvable.');
      return;
    }

    const reference = goodsIssueNote.sequential || goodsIssueNote.id.toString();
    const message =
      `Bonjour ${clientName},\n\n` +
      `Veuillez trouver le bon de sortie ${reference} en piece jointe.\n\n` +
      'Cordialement.';

    setIsSending(true);
    try {
      const blob = await api.goodsIssueNote.preview(goodsIssueNote.id, 'template1');
      downloadDocumentBlob(blob, `${reference}.pdf`);
      openWhatsAppComposer(
        phone || '',
        `${message}\n\nLe PDF a ete telecharge sur votre appareil. Ajoutez-le a la conversation avant l'envoi.`
      );
      toast.success('Document prepare pour envoi WhatsApp.');
      onClose();
    } catch {
      toast.error("Impossible de preparer le document pour WhatsApp.");
    } finally {
      setIsSending(false);
    }
  };

  const clientName =
    goodsIssueNote?.firm?.name ||
    tInvoicing('goodsIssueNote.details.walk_in_customer', {
      defaultValue: 'Client passager'
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[600px]">
        <DialogHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-900 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-green-500" />
            <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {tInvoicing('goodsIssueNote.details.send_whatsapp', {
                defaultValue: 'Envoyer par WhatsApp'
              })}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Saisir le numéro de téléphone de{' '}
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{clientName}</span>
          </p>

          <div className="space-y-2">
            <Label htmlFor="goods-issue-note-whatsapp-phone">Numéro de téléphone</Label>
            <PhoneInput
              id="goods-issue-note-whatsapp-phone"
              value={phone as any}
              onChange={(value) => setPhone(value)}
              className="h-11 shadow-sm"
              defaultCountry="TN"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-900 dark:bg-zinc-900/50">
          <Button variant="outline" onClick={onClose} className="min-w-[100px]">
            Retour
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="min-w-[100px]">
            {isSending ? 'Preparation...' : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

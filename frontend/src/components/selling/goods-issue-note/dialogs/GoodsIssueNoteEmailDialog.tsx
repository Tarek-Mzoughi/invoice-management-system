import React from 'react';
import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoodsIssueNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api';

interface GoodsIssueNoteEmailDialogProps {
  open: boolean;
  onClose: () => void;
  goodsIssueNote: GoodsIssueNote | null;
}

export const GoodsIssueNoteEmailDialog: React.FC<GoodsIssueNoteEmailDialogProps> = ({
  open,
  onClose,
  goodsIssueNote
}) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const locale = router.locale === 'fr' ? fr : enUS;
  const numberLocale = router.locale === 'fr' ? 'fr-FR' : 'en-US';

  const [subject, setSubject] = React.useState('');
  const [recipient, setRecipient] = React.useState('');
  const [cc, setCc] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    if (!goodsIssueNote || !open) return;

    const reference = goodsIssueNote.sequential || goodsIssueNote.id?.toString() || '';
    const dateStr = goodsIssueNote.date
      ? format(parseISO(goodsIssueNote.date), 'd MMMM yyyy', { locale })
      : '';
    const amount =
      goodsIssueNote.total?.toLocaleString(numberLocale, {
        minimumFractionDigits: goodsIssueNote.currency?.digitAfterComma ?? 3,
        maximumFractionDigits: goodsIssueNote.currency?.digitAfterComma ?? 3
      }) || '0';
    const currency = goodsIssueNote.currency?.symbol || 'DT';
    const clientName =
      goodsIssueNote.firm?.name ||
      tInvoicing('goodsIssueNote.details.walk_in_customer', {
        defaultValue: 'Client passager'
      });

    setSubject(`[Document] Bon de sortie ${reference}`);
    setRecipient(goodsIssueNote.interlocutor?.email || '');
    setCc('');
    setMessage(
      `Bonjour ${clientName},\n\n` +
        `Vous trouverez ci-joint votre bon de sortie.\n\n` +
        `Référence : ${reference}\n` +
        `Date du document : ${dateStr}\n` +
        `Montant total : ${amount} ${currency}\n\n` +
        `Cordialement`
    );
  }, [goodsIssueNote, locale, numberLocale, open, tInvoicing]);

  const handleSend = async () => {
    if (!goodsIssueNote?.id) {
      toast.error('Document introuvable.');
      return;
    }
    if (!recipient.trim()) {
      toast.error('Veuillez saisir un destinataire.');
      return;
    }

    setIsSending(true);
    try {
      await api.goodsIssueNote.sendEmail(goodsIssueNote.id, {
        to: recipient.trim(),
        cc: cc.trim() || undefined,
        subject,
        message,
        template: 'template1'
      });
      toast.success('Email envoye avec le document en piece jointe.');
      onClose();
    } catch {
      toast.error("Impossible d'envoyer l'email. Verifiez la configuration SMTP.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[1000px]">
        <DialogHeader className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-900 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {tInvoicing('goodsIssueNote.details.send_email', {
                defaultValue: 'Envoyer par email'
              })}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="goods-issue-note-email-subject">Objet</Label>
            <Input
              id="goods-issue-note-email-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="h-10 border-zinc-200 shadow-sm dark:border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goods-issue-note-email-recipient">Destinataire</Label>
            <Input
              id="goods-issue-note-email-recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              className="h-10 border-zinc-200 shadow-sm dark:border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goods-issue-note-email-cc">CC (optionnel)</Label>
            <Input
              id="goods-issue-note-email-cc"
              value={cc}
              onChange={(event) => setCc(event.target.value)}
              className="h-10 border-zinc-200 shadow-sm dark:border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goods-issue-note-email-message">Message</Label>
            <Textarea
              id="goods-issue-note-email-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-[220px] resize-none border-zinc-200 p-4 shadow-sm dark:border-zinc-800"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-900 dark:bg-zinc-900/50">
          <Button variant="outline" onClick={onClose} className="px-6">
            Retour
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="gap-2 px-6">
            <Send className="h-4 w-4" />
            {isSending ? 'Preparation...' : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

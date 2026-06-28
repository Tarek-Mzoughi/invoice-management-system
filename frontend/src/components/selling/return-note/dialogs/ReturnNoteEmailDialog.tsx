import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import { ReturnNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';
import { api } from '@/api';

interface ReturnNoteEmailDialogProps {
  open: boolean;
  onClose: () => void;
  returnNote: ReturnNote | null;
  scope?: 'selling' | 'buying';
}

export const ReturnNoteEmailDialog: React.FC<ReturnNoteEmailDialogProps> = ({
  open,
  onClose,
  returnNote,
  scope
}) => {
  const documentLabels = useScopedDocumentLabels('returnNote', scope);
  const [subject, setSubject] = React.useState('');
  const [recipient, setRecipient] = React.useState('');
  const [cc, setCc] = React.useState('tarekmzoughi.tn@gmail.com');
  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    if (!returnNote || !open) return;

    const reference = documentLabels.displayNumber(returnNote);
    const dateStr = returnNote.date
      ? format(parseISO(returnNote.date), 'd MMMM yyyy', { locale: fr })
      : '';
    const amount =
      returnNote.total?.toLocaleString('fr-FR', {
        minimumFractionDigits: returnNote.currency?.digitAfterComma ?? 3,
        maximumFractionDigits: returnNote.currency?.digitAfterComma ?? 3
      }) || '0,000';
    const currency = returnNote.currency?.symbol || 'DT';
    const partnerName = returnNote.firm?.name || documentLabels.partnerFallback;
    const documentName = documentLabels.document.toLowerCase();

    setSubject(`[Tarek Mzoughi] ${documentLabels.document} ${reference}`);
    setRecipient(returnNote.interlocutor?.email || 'client@example.com');
    setMessage(
      `Cher(e) ${partnerName},\n\n` +
        `Vous trouverez ci-joint votre ${documentName}.\n\n` +
        `Référence : ${reference}\n` +
        `Date du document : ${dateStr}\n` +
        `Montant total : ${amount} ${currency}\n\n` +
        `Cordialement,\nTarek Mzoughi`
    );
  }, [documentLabels, open, returnNote]);

  const handleSend = async () => {
    if (!returnNote?.id) {
      toast.error('Document introuvable.');
      return;
    }
    if (!recipient.trim()) {
      toast.error('Veuillez saisir un destinataire.');
      return;
    }

    setIsSending(true);
    try {
      await api.returnNote.sendEmail(returnNote.id, {
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
              Envoyer par email
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="return-note-email-subject">Objet</Label>
            <Input
              id="return-note-email-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="h-10 border-zinc-200 shadow-sm dark:border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="return-note-email-recipient">Destinataire</Label>
            <Input
              id="return-note-email-recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              className="h-10 border-zinc-200 shadow-sm dark:border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="return-note-email-cc">CC (optionnel)</Label>
            <Input
              id="return-note-email-cc"
              value={cc}
              onChange={(event) => setCc(event.target.value)}
              className="h-10 border-zinc-200 shadow-sm dark:border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="return-note-email-message">Message</Label>
            <Textarea
              id="return-note-email-message"
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

import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send } from 'lucide-react';
import { Quotation } from '@/types';
import { toast } from 'sonner';
import { api } from '@/api';

interface QuotationEmailDialogProps {
  open: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

export const QuotationEmailDialog: React.FC<QuotationEmailDialogProps> = ({
  open,
  onClose,
  quotation
}) => {
  const { t: tCommon } = useTranslation('common');

  const [subject, setSubject] = React.useState('');
  const [recipient, setRecipient] = React.useState('');
  const [cc, setCc] = React.useState('tarekmzoughi.tn@gmail.com');
  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    if (quotation && open) {
      const reference = quotation.sequential || quotation.id?.toString() || '';
      const dateStr = quotation.date
        ? format(parseISO(quotation.date), '6 MMMM yyyy', { locale: fr })
        : '';
      const amount =
        quotation.total?.toLocaleString('fr-FR', { minimumFractionDigits: 3 }) || '0,000';
      const currency = quotation.currency?.symbol || 'DT';
      const clientName = quotation.firm?.name || 'Client passager';

      setSubject(`[Tarek Mzoughi] Devis ${reference}`);
      setRecipient(quotation.interlocutor?.email || 'client@example.com');

      setMessage(
        `Cher(e) ${clientName},\n\n` +
          `Vous trouverez ci-joint votre document.\n\n` +
          `Référence: ${reference}\n` +
          `Date du document: ${dateStr}\n` +
          `Montant total: ${amount} ${currency}\n\n` +
          `Cordialement,\nTarek Mzoughi`
      );
    }
  }, [quotation, open]);

  const handleSend = async () => {
    if (!quotation?.id) {
      toast.error('Document introuvable.');
      return;
    }

    if (!recipient.trim()) {
      toast.error('Veuillez saisir un destinataire.');
      return;
    }

    setIsSending(true);
    try {
      await api.quotation.sendEmail(quotation.id, {
        to: recipient,
        cc: cc.trim() || undefined,
        subject,
        message,
        template: 'template1'
      });

      toast.success('Email envoye avec le devis en piece jointe.');
      onClose();
    } catch {
      toast.error("Impossible d'envoyer l'email. Verifiez la configuration SMTP.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[1000px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl">
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {tCommon('email.send_by_email')}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="subject"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {tCommon('email.subject')}
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-10 border-zinc-200 dark:border-zinc-800 focus:ring-primary shadow-sm"
              placeholder="Objet de l'email"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="recipient"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {tCommon('email.recipient')}
            </Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="h-10 border-zinc-200 dark:border-zinc-800 focus:ring-primary shadow-sm"
              placeholder="Ex: client@exemple.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {tCommon('email.cc_optional')}
            </Label>
            <Input
              id="cc"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="h-10 border-zinc-200 dark:border-zinc-800 focus:ring-primary shadow-sm"
              placeholder="Ex: contact@votreentreprise.com"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="message"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[220px] resize-none border-zinc-200 dark:border-zinc-800 focus:ring-primary shadow-sm p-4 leading-relaxed"
              placeholder="Écrivez votre message ici..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Retour
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="px-6 gap-2"
          >
            <Send className="h-4 w-4" /> {isSending ? 'Preparation...' : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

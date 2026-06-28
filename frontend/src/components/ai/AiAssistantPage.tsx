import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AiMessage, AiChatAttachment, AiMessageAttachment } from '@/types/ai';
import { AiMessageBubble } from './AiMessageBubble';
import { AiConversationHistory } from './AiConversationHistory';
import { AiLoadingDots } from './AiLoadingState';
import { ai } from '@/api/ai';
import {
  Bot,
  FileText,
  History,
  MessageSquarePlus,
  Paperclip,
  Send,
  Sparkles,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface PendingFile {
  file: File;
  previewUrl: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SUGGESTED_PROMPTS = [
  { icon: FileText, label: 'Créer une facture', prompt: 'Crée une facture pour' },
  { icon: Sparkles, label: 'Résumé du mois', prompt: 'Donne-moi un résumé de mon activité ce mois' },
  {
    icon: FileText,
    label: 'Top clients',
    prompt: 'Quels sont mes 5 meilleurs clients par chiffre d\'affaires ?'
  },
  {
    icon: Sparkles,
    label: 'Factures impayées',
    prompt: 'Liste mes factures impayées depuis plus de 30 jours'
  },
  {
    icon: Sparkles,
    label: 'Graphique CA',
    prompt: 'Montre-moi un graphique de mon chiffre d\'affaires des 6 derniers mois'
  },
  {
    icon: FileText,
    label: 'Paiements récents',
    prompt: 'Quels sont mes paiements reçus ces 30 derniers jours ?'
  }
];

export function AiAssistantPage() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [confirmingActions, setConfirmingActions] = useState<Set<string>>(new Set());
  const [resolvedActions, setResolvedActions] = useState<Set<string>>(new Set());
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmingRef = useRef<Set<string>>(new Set());
  const resolvedRef = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string, extra?: Partial<AiMessage>) => {
      const msg: AiMessage = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        role,
        content,
        timestamp: new Date(),
        ...extra
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(`Type non supporté: ${file.type}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Fichier trop volumineux (max 5MB): ${file.name}`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      setPendingFiles((prev) => [...prev, { file, previewUrl }]);
    }
    e.target.value = '';
  }, []);

  const removePendingFile = useCallback((idx: number) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const handleSend = useCallback(
    async (messageOverride?: string) => {
      const trimmed = (messageOverride ?? input).trim();
      if ((!trimmed && pendingFiles.length === 0) || isLoading) return;

      const filesToSend = [...pendingFiles];
      if (!messageOverride) setInput('');
      setPendingFiles([]);

      const messageAttachments: AiMessageAttachment[] = filesToSend.map((pf) => ({
        mimeType: pf.file.type,
        fileName: pf.file.name,
        previewUrl: pf.previewUrl
      }));

      addMessage('user', trimmed || '(fichier joint)', {
        attachments: messageAttachments.length > 0 ? messageAttachments : undefined
      });
      setIsLoading(true);

      try {
        let attachments: AiChatAttachment[] | undefined;
        if (filesToSend.length > 0) {
          attachments = await Promise.all(
            filesToSend.map(async (pf) => ({
              mimeType: pf.file.type,
              data: await fileToBase64(pf.file),
              fileName: pf.file.name
            }))
          );
        }

        const response = await ai.sendMessage({
          message: trimmed || 'Analyse ce fichier.',
          conversationId,
          attachments
        });

        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        addMessage('assistant', response.message, {
          type: response.type,
          chart: response.chart,
          action: response.action,
          table: response.table,
          kpis: response.kpis,
          data: response.data
        });
      } catch {
        addMessage('assistant', 'Une erreur est survenue. Veuillez réessayer.', {
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, pendingFiles, conversationId, addMessage]
  );

  const handleConfirmAction = useCallback(
    async (actionId: string, overrides?: Record<string, unknown>) => {
      if (confirmingRef.current.has(actionId) || resolvedRef.current.has(actionId)) return;
      confirmingRef.current.add(actionId);
      setConfirmingActions((prev) => new Set(prev).add(actionId));

      try {
        const result = await ai.confirmAction(actionId, overrides);
        resolvedRef.current.add(actionId);
        setResolvedActions((prev) => new Set(prev).add(actionId));

        if (result.status === 'already_executed') return;

        if (result.success) {
          addMessage('assistant', result.message);
          toast.success('Action exécutée avec succès');
        } else {
          addMessage('assistant', result.message, { type: 'error' });
          toast.error(result.message);
        }
      } catch {
        addMessage('assistant', "Erreur lors de l'exécution de l'action.", { type: 'error' });
        toast.error("Erreur lors de l'exécution");
      } finally {
        confirmingRef.current.delete(actionId);
        setConfirmingActions((prev) => {
          const next = new Set(prev);
          next.delete(actionId);
          return next;
        });
      }
    },
    [addMessage]
  );

  const handleCancelAction = useCallback(
    async (actionId: string) => {
      if (confirmingRef.current.has(actionId) || resolvedRef.current.has(actionId)) return;
      resolvedRef.current.add(actionId);
      setResolvedActions((prev) => new Set(prev).add(actionId));
      try {
        await ai.cancelAction(actionId);
        addMessage('assistant', 'Action annulée.');
      } catch {
        // silently ignore
      }
    },
    [addMessage]
  );

  const handleLoadConversation = useCallback(
    async (convId: string) => {
      try {
        const rawMessages = await ai.getConversationMessages(convId);
        const loaded: AiMessage[] = rawMessages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt),
          type: (m.metadataJson?.type as AiMessage['type']) ?? undefined
        }));
        setMessages(loaded);
        setConversationId(convId);
        setConfirmingActions(new Set());
        setResolvedActions(new Set());
        confirmingRef.current = new Set();
        resolvedRef.current = new Set();
      } catch {
        toast.error('Impossible de charger la conversation');
      }
    },
    []
  );

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setConfirmingActions(new Set());
    setResolvedActions(new Set());
    confirmingRef.current = new Set();
    resolvedRef.current = new Set();
    setShowHistory(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden -mx-10 max-md:-mx-4">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-gradient-to-r from-primary/5 to-transparent shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-none">Assistant IA</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? 'En train de réfléchir...' : 'En ligne'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowHistory((prev) => !prev)}>
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Historique</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleNewConversation}>
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Nouvelle conversation</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        <AiConversationHistory
          open={showHistory}
          onClose={() => setShowHistory(false)}
          currentConversationId={conversationId}
          onSelectConversation={handleLoadConversation}
          onNewConversation={handleNewConversation}
        />

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-4xl mx-auto p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                  <Sparkles className="h-10 w-10 text-primary opacity-60" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Comment puis-je vous aider ?</h3>
                <p className="text-sm text-muted-foreground max-w-[400px] mb-8">
                  Posez une question, demandez un graphique ou une action sur vos données.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-[600px]">
                  {SUGGESTED_PROMPTS.map((sp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sp.prompt)}
                      className="flex items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm hover:bg-muted/60 transition-colors">
                      <sp.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="line-clamp-1">{sp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <AiMessageBubble
                    key={msg.id}
                    message={msg}
                    onConfirmAction={handleConfirmAction}
                    onCancelAction={handleCancelAction}
                    confirmingActions={confirmingActions}
                    resolvedActions={resolvedActions}
                  />
                ))}
              </>
            )}

            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="rounded-lg bg-muted px-4 py-3">
                  <AiLoadingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-muted/30 shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Pending file previews */}
          {pendingFiles.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {pendingFiles.map((pf, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg border bg-background overflow-hidden h-16 w-16">
                  {pf.file.type.startsWith('image/') ? (
                    <img
                      src={pf.previewUrl}
                      alt={pf.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full p-1">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center mt-0.5">
                        {pf.file.name}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removePendingFile(idx)}
                    className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-[44px] w-[44px] shrink-0 rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}>
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Joindre un fichier (image, PDF)</TooltipContent>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              multiple
              onChange={handleFileSelect}
            />

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              className={cn(
                'flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm',
                'placeholder:text-muted-foreground/60',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40',
                'min-h-[44px] max-h-[140px]',
                'transition-shadow duration-150'
              )}
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className={cn(
                'h-[44px] w-[44px] shrink-0 rounded-lg',
                'transition-all duration-150',
                (input.trim() || pendingFiles.length > 0) && !isLoading && 'bg-primary shadow-md hover:shadow-lg'
              )}
              onClick={() => handleSend()}
              disabled={(!input.trim() && pendingFiles.length === 0) || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Entrée pour envoyer · Shift+Entrée pour un retour · Images et PDF acceptés
          </p>
        </div>
      </div>
    </div>
  );
}

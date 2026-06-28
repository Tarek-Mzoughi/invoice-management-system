import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AiConversation } from '@/types/ai';
import { ai } from '@/api/ai';
import { History, MessageSquare, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface AiConversationHistoryProps {
  open: boolean;
  onClose: () => void;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function AiConversationHistory({
  open,
  onClose,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: AiConversationHistoryProps) {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ai.listConversations(1, 50);
      setConversations(result.data);
    } catch {
      toast.error('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open, loadConversations]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, convId: string) => {
      e.stopPropagation();
      try {
        await ai.deleteConversation(convId);
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (convId === currentConversationId) {
          onNewConversation();
        }
        toast.success('Conversation supprimée');
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    },
    [currentConversationId, onNewConversation]
  );

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-background animate-in slide-in-from-left-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Historique</h3>
          <span className="text-xs text-muted-foreground">({conversations.length})</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucune conversation
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left',
                  'hover:bg-muted/60 transition-colors group',
                  conv.id === currentConversationId && 'bg-primary/10 border border-primary/20'
                )}>
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{conv.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatRelativeDate(conv.updatedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(e, conv.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { AiMessage } from '@/types/ai';
import { AiResponseRenderer } from './AiResponseRenderer';
import { Bot, FileText, User } from 'lucide-react';

interface AiMessageBubbleProps {
  message: AiMessage;
  onConfirmAction?: (actionId: string, overrides?: Record<string, unknown>) => void;
  onCancelAction?: (actionId: string) => void;
  confirmingActions?: Set<string>;
  resolvedActions?: Set<string>;
}

export function AiMessageBubble({
  message,
  onConfirmAction,
  onCancelAction,
  confirmingActions,
  resolvedActions
}: AiMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn(
        'flex flex-col gap-2 min-w-0',
        isUser ? 'items-end max-w-[80%]' : 'items-start max-w-[calc(100%-3rem)]'
      )}>
        {isUser ? (
          <div className="flex flex-col gap-2 items-end">
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="rounded-lg border overflow-hidden h-20 w-20 bg-muted">
                    {att.mimeType.startsWith('image/') && att.previewUrl ? (
                      <img
                        src={att.previewUrl}
                        alt={att.fileName ?? 'image'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full p-1">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground truncate w-full text-center mt-0.5">
                          {att.fileName ?? 'document'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {message.content && message.content !== '(fichier joint)' && (
              <div className="rounded-lg px-4 py-3 text-sm bg-primary text-primary-foreground">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            )}
          </div>
        ) : (
          <AiResponseRenderer
            message={message}
            onConfirmAction={onConfirmAction}
            onCancelAction={onCancelAction}
            confirmingActions={confirmingActions}
            resolvedActions={resolvedActions}
          />
        )}

        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}

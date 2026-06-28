import React from 'react';

export function AiLoadingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
    </div>
  );
}

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isPending?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, isPending, value, placeholder, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm  placeholder:text-zinc-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950  dark:placeholder:text-zinc-400 ',
          isPending ? 'animate-pulse bg-gray-100 rounded w-full disabled:cursor-auto' : '',
          className
        )}
        ref={ref}
        {...(isPending
          ? { disabled: true, value: '', placeholder: '' }
          : { value: value ?? '', placeholder, ...props })}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };

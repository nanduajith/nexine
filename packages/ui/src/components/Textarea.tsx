import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Render with the monospace font (default true — most tool I/O is code). */
  readonly mono?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, mono = true, spellCheck = false, ...props }, ref) => (
    <textarea
      ref={ref}
      spellCheck={spellCheck}
      className={cn(
        'w-full resize-none rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-bg)] p-3 text-sm leading-relaxed text-[var(--nx-fg)] placeholder:text-[var(--nx-fg-subtle)] transition-colors',
        'focus-visible:border-[var(--nx-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nx-primary-soft)]',
        mono && 'font-[family-name:var(--nx-font-mono)]',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

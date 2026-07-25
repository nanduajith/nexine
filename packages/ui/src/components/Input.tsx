import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, mono = false, spellCheck = false, ...props }, ref) => (
    <input
      ref={ref}
      spellCheck={spellCheck}
      className={cn(
        'h-9 w-full rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3 text-sm text-[var(--nx-fg)] placeholder:text-[var(--nx-fg-subtle)] transition-colors',
        'focus-visible:border-[var(--nx-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nx-primary-soft)]',
        mono && 'font-[family-name:var(--nx-font-mono)]',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

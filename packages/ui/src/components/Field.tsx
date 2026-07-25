import { type ReactNode, useId } from 'react';

import { cn } from '../lib/cn';

export interface FieldProps {
  readonly label: string;
  readonly htmlFor?: string;
  readonly hint?: string;
  readonly error?: string | undefined;
  /** Optional element rendered on the right of the label row (e.g. a copy button). */
  readonly action?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * A labelled form field with an optional hint, error, and inline action. Handles
 * the label/description wiring so individual tools don't repeat a11y plumbing.
 */
export function Field({ label, htmlFor, hint, error, action, className, children }: FieldProps) {
  const generatedId = useId();
  const describedBy = hint || error ? `${generatedId}-desc` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium tracking-wide text-[var(--nx-fg-muted)] uppercase"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
      {(hint || error) && (
        <p
          id={describedBy}
          className={cn(
            'text-xs',
            error ? 'text-[var(--nx-danger)]' : 'text-[var(--nx-fg-subtle)]',
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

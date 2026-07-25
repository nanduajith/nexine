import { type ReactNode } from 'react';

import { cn } from '../lib/cn';

/** Renders a keyboard key hint, e.g. <Kbd>⌘</Kbd><Kbd>K</Kbd>. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-1.5 font-[family-name:var(--nx-font-mono)] text-[11px] font-medium text-[var(--nx-fg-muted)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

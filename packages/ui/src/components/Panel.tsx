import { type ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface PanelProps {
  readonly title?: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly bodyClassName?: string;
  readonly children: ReactNode;
}

/** A surface container with an optional header row for title + actions. */
export function Panel({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-[var(--nx-radius-lg)] border border-[var(--nx-border)] bg-[var(--nx-surface)]',
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--nx-border)] px-4 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-sm font-semibold text-[var(--nx-fg)]">{title}</h2>
            )}
            {description && (
              <p className="truncate text-xs text-[var(--nx-fg-subtle)]">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={cn('flex-1 p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

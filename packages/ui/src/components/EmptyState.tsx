import { type LucideIcon } from 'lucide-react';

import { cn } from '../lib/cn';

export interface EmptyStateProps {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly description?: string;
  readonly className?: string;
}

/** Centered placeholder for empty results / no-input states. */
export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-12 text-center text-[var(--nx-fg-subtle)]',
        className,
      )}
    >
      {Icon && <Icon size={28} strokeWidth={1.5} className="opacity-60" />}
      <p className="text-sm font-medium text-[var(--nx-fg-muted)]">{title}</p>
      {description && <p className="max-w-xs text-xs">{description}</p>}
    </div>
  );
}

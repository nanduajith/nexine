import { cva, type VariantProps } from 'class-variance-authority';
import { type ReactNode } from 'react';

import { cn } from '../lib/cn';

const badge = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--nx-surface-2)] text-[var(--nx-fg-muted)]',
        primary: 'bg-[var(--nx-primary-soft)] text-[var(--nx-primary)]',
        success: 'bg-[var(--nx-success)]/15 text-[var(--nx-success)]',
        danger: 'bg-[var(--nx-danger)]/15 text-[var(--nx-danger)]',
        warning: 'bg-[var(--nx-warning)]/15 text-[var(--nx-warning)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps extends VariantProps<typeof badge> {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Badge({ tone, className, children }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)}>{children}</span>;
}

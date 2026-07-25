import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

const button = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--nx-radius)] font-medium transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nx-ring)]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--nx-primary)] text-[var(--nx-primary-fg)] hover:bg-[var(--nx-primary-hover)]',
        secondary:
          'bg-[var(--nx-surface-2)] text-[var(--nx-fg)] border border-[var(--nx-border)] hover:bg-[var(--nx-surface-3)]',
        ghost: 'text-[var(--nx-fg-muted)] hover:bg-[var(--nx-surface-2)] hover:text-[var(--nx-fg)]',
        danger: 'bg-[var(--nx-danger)] text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-4 text-sm',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(button({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

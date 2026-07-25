import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '../lib/cn';

import { Button, type ButtonProps } from './Button';

export interface CopyButtonProps extends Omit<ButtonProps, 'children' | 'onClick'> {
  /** The text to copy. If empty/undefined the button is disabled. */
  readonly value: string | undefined;
  /** Optional visible label (icon-only when omitted). */
  readonly label?: string;
}

/**
 * Copy-to-clipboard button with success feedback. Uses the local Clipboard API —
 * this is a same-device operation and involves no network egress.
 */
export function CopyButton({
  value,
  label,
  className,
  variant = 'ghost',
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can be blocked (e.g. no focus); fail silently rather than throw.
    }
  }, [value]);

  return (
    <Button
      variant={variant}
      size={label ? 'sm' : 'icon-sm'}
      disabled={!value}
      onClick={copy}
      aria-label={label ?? 'Copy to clipboard'}
      className={cn(copied && 'text-[var(--nx-success)]', className)}
      {...props}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </Button>
  );
}

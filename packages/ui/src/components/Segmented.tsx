import { cn } from '../lib/cn';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface SegmentedProps<T extends string> {
  readonly options: ReadonlyArray<SegmentedOption<T>>;
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly 'aria-label'?: string;
  readonly className?: string;
}

/** An accessible segmented control (radio-group semantics) for mode switching. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ...aria
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={aria['aria-label']}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[var(--nx-radius-sm)] px-3 py-1 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--nx-ring)]',
              active
                ? 'bg-[var(--nx-surface)] text-[var(--nx-fg)] shadow-[var(--nx-shadow-sm)]'
                : 'text-[var(--nx-fg-muted)] hover:text-[var(--nx-fg)]',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

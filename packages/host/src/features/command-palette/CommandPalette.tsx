import { getCategory, type ToolRegistry } from '@nexine/core';
import { cn, Kbd, type ToolModule } from '@nexine/ui';
import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { toolIcon } from '../../lib/icons';

interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect: (toolId: string) => void;
  /** The live tool set (first-party + installed plugins) to search over. */
  readonly registry: ToolRegistry<ToolModule>;
}

/**
 * Keyboard-first tool switcher (⌘K). Built in-house rather than pulling a
 * dependency — full control over behaviour and a smaller audit surface.
 */
export function CommandPalette({ open, onClose, onSelect, registry }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<readonly ToolModule[]>(
    () => (query.trim() ? registry.search(query) : registry.all()),
    [query, registry],
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus after paint so the dialog is mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  const commit = (tool: ToolModule | undefined) => {
    if (!tool) return;
    onSelect(tool.id);
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        commit(results[activeIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search tools"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-[var(--nx-radius-lg)] border border-[var(--nx-border)] bg-[var(--nx-surface)] shadow-[var(--nx-shadow-lg)]"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--nx-border)] px-4">
          <Search size={16} className="text-[var(--nx-fg-subtle)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools…"
            className="h-12 w-full bg-transparent text-sm text-[var(--nx-fg)] outline-none placeholder:text-[var(--nx-fg-subtle)]"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-[var(--nx-fg-subtle)]">
              No tools match “{query}”.
            </p>
          ) : (
            results.map((tool, index) => {
              const Icon = toolIcon(tool.icon);
              const active = index === activeIndex;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => commit(tool)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[var(--nx-radius)] px-3 py-2 text-left transition-colors',
                    active ? 'bg-[var(--nx-primary-soft)]' : 'hover:bg-[var(--nx-surface-2)]',
                  )}
                >
                  <Icon size={16} className="shrink-0 text-[var(--nx-fg-muted)]" />
                  <span className="shrink-0 text-sm font-medium text-[var(--nx-fg)]">
                    {tool.name}
                  </span>
                  <span className="truncate text-xs text-[var(--nx-fg-subtle)]">
                    {tool.description}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] font-medium tracking-wide text-[var(--nx-fg-subtle)] uppercase">
                    {getCategory(tool.category).label}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--nx-border)] px-4 py-2 text-[11px] text-[var(--nx-fg-subtle)]">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>
              <CornerDownLeft size={11} />
            </Kbd>
            to open
          </span>
          <span className="flex items-center gap-1">
            <Kbd>esc</Kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}

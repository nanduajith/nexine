import { Button, Panel } from '@nexine/ui';
import { Download, Info } from 'lucide-react';

export function DesktopUpsell() {
  return (
    <Panel
      title="Desktop app required"
      description="This feature is exclusive to the Nexine desktop application."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] p-4 text-sm text-[var(--nx-fg)]">
          <Info size={16} className="mt-0.5 shrink-0 text-[var(--nx-primary)]" />
          <div className="flex-1 space-y-2">
            <p className="font-medium">You're missing out!</p>
            <p className="text-[var(--nx-fg-subtle)]">
              The web version of Nexine is a lightweight demo of first-party tools. To unlock
              third-party plugins, strict network egress control, publisher trust policies, and the
              global{' '}
              <kbd className="rounded border border-[var(--nx-border-strong)] bg-[var(--nx-bg)] px-1 font-mono text-[10px]">
                ⌘⇧Space
              </kbd>{' '}
              summon hotkey, you need the desktop app.
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <Button
            variant="primary"
            onClick={() => window.open('https://github.com/nanduajith/nexine/releases', '_blank')}
          >
            <Download size={14} className="mr-2" />
            Download Desktop App
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/**
 * Human-readable rendering of a manifest's security-relevant surface, shared by
 * `pack`, `verify` and `inspect` so a plugin's permissions and data-flows are
 * always presented the same way.
 */

import type { Permission, PluginManifest } from '@nexine/sdk';

import { style } from './console';

function describePermission(permission: Permission): string {
  switch (permission.id) {
    case 'network':
      return `network → ${permission.hosts.join(', ')}`;
    case 'storage':
      return `storage (isolated to this plugin)`;
    case 'clipboard':
      return `clipboard (${permission.access})`;
  }
}

export function renderManifest(manifest: PluginManifest): string[] {
  const lines: string[] = [];
  lines.push(`${style.bold(manifest.name)} ${style.dim(`v${manifest.version}`)}`);
  lines.push(`  ${style.dim('id')}        ${manifest.id}`);
  lines.push(`  ${style.dim('category')}  ${manifest.category}`);
  if (manifest.author) lines.push(`  ${style.dim('author')}    ${manifest.author}`);

  const permissions = manifest.permissions ?? [];
  if (permissions.length === 0) {
    lines.push(`  ${style.dim('perms')}     ${style.green('none — fully sandboxed, zero egress')}`);
  } else {
    lines.push(`  ${style.dim('perms')}`);
    for (const p of permissions) {
      const tone = p.id === 'network' ? style.yellow : style.cyan;
      lines.push(`    • ${tone(describePermission(p))}`);
    }
  }

  const flows = manifest.dataFlows ?? [];
  if (flows.length > 0) {
    lines.push(`  ${style.dim('dataFlows')}`);
    for (const f of flows) {
      lines.push(
        `    • ${f.destination} — ${f.description}${f.optional ? style.dim(' (optional)') : ''}`,
      );
    }
  }
  return lines;
}

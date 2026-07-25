import type { Permission } from '@nexine/sdk';

/**
 * Plain-language copy for a requested permission, shown in every consent surface
 * (in-app demo plugins and side-loaded packages) so the user reads the same
 * description of what a capability means wherever a plugin asks for it.
 */
export function describePermission(permission: Permission): { label: string; detail: string } {
  switch (permission.id) {
    case 'network':
      return { label: 'Network access', detail: `connects to ${permission.hosts.join(', ')}` };
    case 'storage':
      return {
        label: 'On-device storage',
        detail: 'isolated to this plugin; no other plugin can read it',
      };
    case 'clipboard':
      return {
        label: `Clipboard (${permission.access})`,
        detail: 'read and/or write the system clipboard',
      };
  }
}

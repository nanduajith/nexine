// The guest-side SDK: everything a plugin author imports. Kept as a separate
// entry (`@nexine/sdk/guest`) so plugin bundles pull in only the guest runtime,
// not host-oriented types.

export type {
  ClipboardApi,
  HostBridge,
  PluginContext,
  PluginDefinition,
  PluginInstance,
  PluginSetup,
  StorageApi,
} from './api';
export { definePlugin, PermissionDeniedError } from './api';
export { runNexineGuest } from './bootstrap';

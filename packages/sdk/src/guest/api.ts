import type { PluginManifest } from '../manifest';
import type { Permission } from '../permissions';

/**
 * The author-facing SDK surface. A plugin is a module whose default export is a
 * `PluginDefinition` produced by `definePlugin`. Inside `setup`, the plugin gets
 * a `PluginContext` with a permissioned `host` bridge and returns a
 * `PluginInstance` the runtime mounts into the (sandboxed) iframe DOM.
 *
 * Everything here is UI-framework-agnostic: `mount` receives a plain DOM element,
 * so a plugin may use React, Vue, or vanilla DOM. The design system is available
 * separately; this contract stays minimal and stable.
 */

/** Per-plugin persistent key/value storage (granted via the `storage` permission). */
export interface StorageApi {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

/** Clipboard access (granted via the `clipboard` permission, scoped to read/write). */
export interface ClipboardApi {
  readText(): Promise<string>;
  writeText(text: string): Promise<void>;
}

/**
 * The bridge to host-mediated capabilities. Each sub-API is present regardless of
 * grant, but calling one the plugin wasn't granted rejects with
 * `PermissionDeniedError` — enforced both here (fast local guard) and by the host
 * (authoritative). Network is intentionally not here: a plugin uses `fetch`
 * directly and the iframe's CSP is the enforcer.
 */
export interface HostBridge {
  readonly storage: StorageApi;
  readonly clipboard: ClipboardApi;
}

export interface PluginContext {
  readonly manifest: PluginManifest;
  /** The permissions actually granted (after host policy resolution). */
  readonly permissions: readonly Permission[];
  readonly host: HostBridge;
}

/** A live plugin: the runtime calls `mount` once, and `unmount` on teardown. */
export interface PluginInstance {
  mount(root: HTMLElement): void | Promise<void>;
  unmount?(): void;
}

export type PluginSetup = (ctx: PluginContext) => PluginInstance | Promise<PluginInstance>;

export interface PluginDefinition {
  readonly setup: PluginSetup;
}

/** Thrown when a plugin calls a capability it was not granted. */
export class PermissionDeniedError extends Error {
  constructor(capability: string) {
    super(`Permission denied: this plugin was not granted '${capability}'.`);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Authoring entry point. Identity at runtime (just returns the definition) but it
 * anchors inference and is the single documented way to declare a plugin, so the
 * shape can evolve without churning every plugin.
 */
export function definePlugin(def: PluginDefinition): PluginDefinition {
  return def;
}

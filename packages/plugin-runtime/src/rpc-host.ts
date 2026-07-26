import { err, ok, type Result } from '@nexine/core';
import type {
  GuestToHostMessage,
  HostRequest,
  InitMessage,
  Permission,
  PluginManifest,
  ResponseMessage,
  RpcError,
} from '@nexine/sdk';
import { RPC_PROTOCOL_VERSION } from '@nexine/sdk';

/**
 * The host side of the plugin RPC. It brokers every capability request a plugin
 * makes over the private `MessageChannel`. Two layers, deliberately separated:
 *
 *  - `handleRequest` — a *pure* function that enforces the granted permissions
 *    and dispatches to host services. This is the security-critical decision and
 *    is fully unit-tested with no browser.
 *  - `attachRpcHost` — thin wiring that reads the port, calls `handleRequest`, and
 *    posts the response back.
 *
 * A plugin can never reach a service it wasn't granted: the check lives here, on
 * the trusted side, independent of the guest's own (advisory) guard.
 */

/** The concrete host implementations the broker dispatches to (all injectable/testable). */
export interface HostServices {
  readonly storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    keys(): Promise<string[]>;
  };
  readonly clipboard: {
    readText(): Promise<string>;
    writeText(text: string): Promise<void>;
  };
}

function denied(message: string): Result<never, RpcError> {
  return err({ code: 'denied', message });
}

function invalid(message: string): Result<never, RpcError> {
  return err({ code: 'invalid', message });
}

/**
 * The `request` object arrives from *untrusted* plugin code over the port, so its
 * TypeScript type is only a compile-time hint — at runtime a malicious guest can
 * send any shape. Validate the value-carrying fields before they reach a host
 * service (e.g. a non-string storage key would coerce and could escape the
 * namespace prefix). Method-level permission checks stay in `handleRequest`.
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function hasStorage(granted: readonly Permission[]): boolean {
  return granted.some((p) => p.id === 'storage');
}

function clipboardAccess(granted: readonly Permission[]): 'read' | 'write' | 'readwrite' | null {
  const perm = granted.find((p) => p.id === 'clipboard');
  return perm && perm.id === 'clipboard' ? perm.access : null;
}

function canRead(access: ReturnType<typeof clipboardAccess>): boolean {
  return access === 'read' || access === 'readwrite';
}
function canWrite(access: ReturnType<typeof clipboardAccess>): boolean {
  return access === 'write' || access === 'readwrite';
}

/**
 * Enforce permissions and dispatch a single request. Returns a `Result` that is
 * serialized straight into the RPC response — errors never throw across the
 * boundary. Pure with respect to the injected `services`.
 */
export async function handleRequest(
  request: HostRequest,
  granted: readonly Permission[],
  services: HostServices,
): Promise<Result<unknown, RpcError>> {
  try {
    switch (request.method) {
      case 'storage.get':
        if (!hasStorage(granted)) return denied('storage permission not granted');
        if (!isString(request.key)) return invalid('storage.get: key must be a string');
        return ok(await services.storage.get(request.key));
      case 'storage.set':
        if (!hasStorage(granted)) return denied('storage permission not granted');
        if (!isString(request.key) || !isString(request.value))
          return invalid('storage.set: key and value must be strings');
        await services.storage.set(request.key, request.value);
        return ok(null);
      case 'storage.remove':
        if (!hasStorage(granted)) return denied('storage permission not granted');
        if (!isString(request.key)) return invalid('storage.remove: key must be a string');
        await services.storage.remove(request.key);
        return ok(null);
      case 'storage.keys':
        if (!hasStorage(granted)) return denied('storage permission not granted');
        return ok(await services.storage.keys());
      case 'clipboard.readText':
        if (!canRead(clipboardAccess(granted))) return denied('clipboard read not granted');
        return ok(await services.clipboard.readText());
      case 'clipboard.writeText':
        if (!canWrite(clipboardAccess(granted))) return denied('clipboard write not granted');
        if (!isString(request.text)) return invalid('clipboard.writeText: text must be a string');
        await services.clipboard.writeText(request.text);
        return ok(null);
      default: {
        // Exhaustiveness guard: a new method must be handled above.
        const _never: never = request;
        return err({ code: 'unsupported', message: `unknown method: ${JSON.stringify(_never)}` });
      }
    }
  } catch (error) {
    return err({
      code: 'internal',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export interface RpcHostHandle {
  /** Tear down the listener (call when the plugin is unloaded). */
  dispose(): void;
}

/**
 * Wire the host end of the channel: send `init`, then broker every request. The
 * guest sends `nx:ready` first; we reply with the manifest and granted set.
 *
 * @remarks All messages over this port are structured-cloneable (plain objects,
 * strings, numbers, booleans, null/undefined, arrays). No functions, DOM nodes,
 * or class instances cross the boundary. This is enforced by the `MessageChannel`
 * (the browser throws `DataCloneError` on non-cloneable values) and by the typed
 * protocol (`GuestToHostMessage` / `HostToGuestMessage`). The guest runs at an
 * opaque origin and may be served from a different scheme (e.g. the Tauri custom
 * protocol) — readable `postMessage` origins are never trusted.
 */
export function attachRpcHost(options: {
  port: MessagePort;
  manifest: PluginManifest;
  granted: readonly Permission[];
  /** The plugin's source, handed to the guest in `nx:init` to run as a blob script. */
  pluginSource: string;
  services: HostServices;
  onFatal?: (message: string) => void;
}): RpcHostHandle {
  const { port, manifest, granted, pluginSource, services, onFatal } = options;

  const listener = (event: MessageEvent<GuestToHostMessage>): void => {
    const message = event.data;
    if (message.type === 'nx:ready') {
      const init: InitMessage = {
        type: 'nx:init',
        protocol: RPC_PROTOCOL_VERSION,
        manifest,
        grantedPermissions: granted,
        pluginSource,
      };
      port.postMessage(init);
      return;
    }
    if (message.type === 'nx:fatal') {
      onFatal?.(message.message);
      return;
    }
    if (message.type === 'nx:request') {
      void handleRequest(message.request, granted, services).then((result) => {
        const response: ResponseMessage = { type: 'nx:response', id: message.id, result };
        port.postMessage(response);
      });
    }
  };

  port.addEventListener('message', listener);
  port.start();

  return {
    dispose() {
      port.removeEventListener('message', listener);
      port.close();
    },
  };
}

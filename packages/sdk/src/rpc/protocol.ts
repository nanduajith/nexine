import type { Result } from '@nexine/core';

import type { PluginManifest } from '../manifest';
import type { Permission } from '../permissions';

/**
 * The wire protocol spoken over a private `MessageChannel` between the host
 * (parent window) and a plugin (sandboxed iframe). Every message is a plain,
 * structured-clone-safe object. The host is the only authority: the guest can
 * *request* capabilities but the host decides, per the resolved permission set,
 * whether to honor each one.
 *
 * Versioned so host and guest can detect a mismatch and refuse rather than
 * misinterpret each other.
 */
export const RPC_PROTOCOL_VERSION = 1 as const;

/** A structured error returned to the guest for a rejected/failed request. */
export interface RpcError {
  readonly code: 'denied' | 'invalid' | 'unsupported' | 'internal';
  readonly message: string;
}

/**
 * Host-mediated capability calls. These are the *only* privileged operations a
 * plugin can attempt; each is checked against the resolved permissions before
 * the host acts. Network is deliberately absent — it is enforced by the iframe's
 * CSP, not brokered here, so a plugin fetches directly (within its allowlist) and
 * the host never becomes a proxy that could leak the no-egress guarantee.
 */
export type HostRequest =
  | { readonly method: 'storage.get'; readonly key: string }
  | { readonly method: 'storage.set'; readonly key: string; readonly value: string }
  | { readonly method: 'storage.remove'; readonly key: string }
  | { readonly method: 'storage.keys' }
  | { readonly method: 'clipboard.readText' }
  | { readonly method: 'clipboard.writeText'; readonly text: string };

export type HostRequestMethod = HostRequest['method'];

/** Guest → host: correlated capability request. */
export interface RequestMessage {
  readonly type: 'nx:request';
  readonly id: number;
  readonly request: HostRequest;
}

/** Host → guest: the result for a prior `RequestMessage` with the same `id`. */
export interface ResponseMessage {
  readonly type: 'nx:response';
  readonly id: number;
  readonly result: Result<unknown, RpcError>;
}

/**
 * Host → guest: the first message on the channel. Carries the manifest and the
 * *granted* permissions (already narrowed by policy), so the guest SDK can shape
 * its host bridge to exactly what was allowed.
 */
export interface InitMessage {
  readonly type: 'nx:init';
  readonly protocol: number;
  readonly manifest: PluginManifest;
  readonly grantedPermissions: readonly Permission[];
}

/** Guest → host: sent once the guest runtime is wired up and ready for `init`. */
export interface ReadyMessage {
  readonly type: 'nx:ready';
  readonly protocol: number;
}

/** Guest → host: unrecoverable guest error (bad protocol, load failure, throw in setup). */
export interface FatalMessage {
  readonly type: 'nx:fatal';
  readonly message: string;
}

export type GuestToHostMessage = ReadyMessage | RequestMessage | FatalMessage;
export type HostToGuestMessage = InitMessage | ResponseMessage;

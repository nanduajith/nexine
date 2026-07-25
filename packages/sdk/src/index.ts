// Public surface of the Nexine plugin SDK — the stable contract that third-party
// tools are built against and that the host validates and enforces. Split into a
// declarative half (manifest/permissions/data-flows) and a runtime half (the RPC
// protocol + guest API, re-exported from `@nexine/sdk/guest`).

// Manifest
export type { PluginManifest } from './manifest';
export { MANIFEST_VERSION } from './manifest';

// Permissions
export type {
  ClipboardPermission,
  NetworkPermission,
  Permission,
  PermissionId,
  StoragePermission,
} from './permissions';
export { isClipboardPermission, isNetworkPermission, isStoragePermission } from './permissions';

// Data-flow declarations
export type { DataFlow } from './data-flow';

// Validation
export type { ManifestIssue } from './validate';
export { validateManifest } from './validate';

// RPC protocol
export type {
  GuestToHostMessage,
  HostRequest,
  HostRequestMethod,
  HostToGuestMessage,
  InitMessage,
  ReadyMessage,
  RequestMessage,
  ResponseMessage,
  RpcError,
  FatalMessage,
} from './rpc/protocol';
export { RPC_PROTOCOL_VERSION } from './rpc/protocol';

// Guest authoring API (also available as `@nexine/sdk/guest`)
export type {
  ClipboardApi,
  HostBridge,
  PluginContext,
  PluginDefinition,
  PluginInstance,
  PluginSetup,
  StorageApi,
} from './guest/api';
export { definePlugin, PermissionDeniedError } from './guest/api';

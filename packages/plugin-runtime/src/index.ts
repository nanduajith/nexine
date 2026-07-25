// Public surface of the host-side plugin runtime. The security kernel (permission
// engine + per-plugin CSP) lands first; the sandboxed iframe loader and RPC broker
// build on top of it.

export type {
  PermissionDecision,
  PermissionResolution,
  PluginPolicy,
  PolicyMode,
} from './permission-engine';
export { DEFAULT_POLICY, resolvePermissions } from './permission-engine';

export type { PluginCspOptions } from './plugin-csp';
export { buildPluginCsp, isNoEgressCsp } from './plugin-csp';

export type { HostServices, RpcHostHandle } from './rpc-host';
export { attachRpcHost, handleRequest } from './rpc-host';

export type { KeyValueBackend } from './services';
export { createClipboardService, createHostServices, createNamespacedStorage } from './services';

export type { PluginSandbox, SandboxOptions } from './sandbox';
export { createPluginSandbox } from './sandbox';

export type { InspectPluginResult, LoadPluginInput, LoadPluginResult } from './plugin-host';
export { inspectPlugin, loadPlugin } from './plugin-host';

export type {
  InspectPackageInput,
  InspectPackageResult,
  LoadPackageInput,
  LoadPackageResult,
  PackageSigner,
} from './package-loader';
export { inspectPackage, loadPackage } from './package-loader';

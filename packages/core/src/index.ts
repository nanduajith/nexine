// Public surface of the framework-free domain core.

// Result type
export type { Result } from './result';
export { ok, err } from './result';

// Tool contract & registry
export type { ToolCategory, ToolMeta } from './tools/types';
export type { CategoryMeta } from './tools/categories';
export { CATEGORIES, getCategory } from './tools/categories';
export { searchTools } from './tools/search';
export type { ToolRegistry } from './tools/registry';
export { createToolRegistry } from './tools/registry';

// Security primitives
export type { CspOptions } from './security/csp';
export {
  buildContentSecurityPolicy,
  buildSandboxDocumentCsp,
  NO_EGRESS_CONNECT_SRC,
} from './security/csp';

import type { ToolCategory } from '@nexine/core';
import { err, ok, type Result } from '@nexine/core';

import type { DataFlow } from './data-flow';
import { MANIFEST_VERSION, type PluginManifest } from './manifest';
import type { Permission } from './permissions';

/**
 * Validates an *untrusted* manifest object (parsed from `manifest.json`) into a
 * typed `PluginManifest`, or a list of every problem found. This runs before any
 * plugin code executes, so it is a security boundary: it is written by hand with
 * no external schema library (nothing to audit but this file), rejects unknown
 * shapes, and is intentionally strict.
 *
 * It returns *all* issues rather than the first, so a plugin author sees the full
 * picture in one pass.
 */

export interface ManifestIssue {
  /** Dotted path to the offending field, e.g. `permissions[0].hosts[1]`. */
  readonly path: string;
  readonly message: string;
}

// Exhaustive by construction: every ToolCategory must appear as a key, or this
// object fails to type-check — so the allowlist can never silently drift.
const CATEGORY_SET: Record<ToolCategory, true> = {
  encoding: true,
  crypto: true,
  web: true,
  text: true,
  data: true,
  generators: true,
  time: true,
};

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

type Issues = ManifestIssue[];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function requireString(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  issues: Issues,
): string | undefined {
  const value = obj[key];
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({ path: `${path}${key}`, message: `must be a non-empty string` });
    return undefined;
  }
  return value;
}

/**
 * A network host must be a well-formed `https:` (or, only for localhost, `http:`)
 * origin with no path, query or fragment — because it becomes a CSP `connect-src`
 * source verbatim. Wildcards are rejected: the allowlist is exact by design.
 */
function validateHost(host: unknown, path: string, issues: Issues): void {
  if (typeof host !== 'string') {
    issues.push({ path, message: 'host must be a string' });
    return;
  }
  let url: URL;
  try {
    url = new URL(host);
  } catch {
    issues.push({ path, message: `not a valid origin: ${host}` });
    return;
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    issues.push({ path, message: `must use https (http allowed only for localhost): ${host}` });
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    issues.push({ path, message: `must be an origin with no path/query/fragment: ${host}` });
  }
  if (host.includes('*')) {
    issues.push({ path, message: `wildcards are not allowed; list exact origins: ${host}` });
  }
}

function validatePermission(raw: unknown, path: string, issues: Issues): Permission | undefined {
  if (!isObject(raw)) {
    issues.push({ path, message: 'permission must be an object' });
    return undefined;
  }
  switch (raw['id']) {
    case 'network': {
      const hosts = raw['hosts'];
      if (!Array.isArray(hosts) || hosts.length === 0) {
        issues.push({ path: `${path}.hosts`, message: 'network requires a non-empty hosts array' });
        return undefined;
      }
      hosts.forEach((h, i) => validateHost(h, `${path}.hosts[${i}]`, issues));
      return issues.length === 0 ? { id: 'network', hosts: hosts as string[] } : undefined;
    }
    case 'clipboard': {
      const access = raw['access'];
      if (access !== 'read' && access !== 'write' && access !== 'readwrite') {
        issues.push({ path: `${path}.access`, message: `must be 'read' | 'write' | 'readwrite'` });
        return undefined;
      }
      return { id: 'clipboard', access };
    }
    case 'storage': {
      const maxBytes = raw['maxBytes'];
      if (maxBytes !== undefined && (typeof maxBytes !== 'number' || maxBytes <= 0)) {
        issues.push({
          path: `${path}.maxBytes`,
          message: 'must be a positive number when present',
        });
        return undefined;
      }
      return maxBytes === undefined ? { id: 'storage' } : { id: 'storage', maxBytes };
    }
    default:
      issues.push({ path: `${path}.id`, message: `unknown permission id: ${String(raw['id'])}` });
      return undefined;
  }
}

function validateDataFlow(raw: unknown, path: string, issues: Issues): DataFlow | undefined {
  if (!isObject(raw)) {
    issues.push({ path, message: 'dataFlow must be an object' });
    return undefined;
  }
  const destination = requireString(raw, 'destination', `${path}.`, issues);
  const description = requireString(raw, 'description', `${path}.`, issues);
  const optional = raw['optional'];
  if (optional !== undefined && typeof optional !== 'boolean') {
    issues.push({ path: `${path}.optional`, message: 'must be a boolean when present' });
  }
  if (destination === undefined || description === undefined) return undefined;
  return typeof optional === 'boolean'
    ? { destination, description, optional }
    : { destination, description };
}

export function validateManifest(input: unknown): Result<PluginManifest, ManifestIssue[]> {
  const issues: Issues = [];

  if (!isObject(input)) {
    return err([{ path: '', message: 'manifest must be an object' }]);
  }

  if (input['manifestVersion'] !== MANIFEST_VERSION) {
    issues.push({
      path: 'manifestVersion',
      message: `unsupported manifest version; expected ${MANIFEST_VERSION}`,
    });
  }

  const id = requireString(input, 'id', '', issues);
  if (id !== undefined && !ID_PATTERN.test(id)) {
    issues.push({ path: 'id', message: 'must be lowercase alphanumeric with . or - separators' });
  }

  const name = requireString(input, 'name', '', issues);
  const description = requireString(input, 'description', '', issues);

  const version = requireString(input, 'version', '', issues);
  if (version !== undefined && !SEMVER_PATTERN.test(version)) {
    issues.push({ path: 'version', message: 'must be a semver string (e.g. 1.0.0)' });
  }

  const category = input['category'];
  if (typeof category !== 'string' || !(category in CATEGORY_SET)) {
    issues.push({ path: 'category', message: 'must be a known tool category' });
  }

  const entry = requireString(input, 'entry', '', issues);
  if (entry !== undefined) {
    if (entry.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(entry) || entry.includes('..')) {
      issues.push({
        path: 'entry',
        message: 'must be a relative path within the package (no scheme, leading / or ..)',
      });
    }
  }

  // Optional fields.
  const author = input['author'];
  if (author !== undefined && typeof author !== 'string') {
    issues.push({ path: 'author', message: 'must be a string when present' });
  }
  const icon = input['icon'];
  if (icon !== undefined && typeof icon !== 'string') {
    issues.push({ path: 'icon', message: 'must be a string when present' });
  }
  const sensitive = input['sensitive'];
  if (sensitive !== undefined && typeof sensitive !== 'boolean') {
    issues.push({ path: 'sensitive', message: 'must be a boolean when present' });
  }
  const keywords = input['keywords'];
  if (
    keywords !== undefined &&
    (!Array.isArray(keywords) || keywords.some((k) => typeof k !== 'string'))
  ) {
    issues.push({ path: 'keywords', message: 'must be an array of strings when present' });
  }

  const permissions: Permission[] = [];
  const rawPermissions = input['permissions'];
  if (rawPermissions !== undefined) {
    if (!Array.isArray(rawPermissions)) {
      issues.push({ path: 'permissions', message: 'must be an array when present' });
    } else {
      rawPermissions.forEach((p, i) => {
        const parsed = validatePermission(p, `permissions[${i}]`, issues);
        if (parsed) permissions.push(parsed);
      });
    }
  }

  const dataFlows: DataFlow[] = [];
  const rawDataFlows = input['dataFlows'];
  if (rawDataFlows !== undefined) {
    if (!Array.isArray(rawDataFlows)) {
      issues.push({ path: 'dataFlows', message: 'must be an array when present' });
    } else {
      rawDataFlows.forEach((f, i) => {
        const parsed = validateDataFlow(f, `dataFlows[${i}]`, issues);
        if (parsed) dataFlows.push(parsed);
      });
    }
  }

  // Cross-field: requesting network egress requires declaring where data goes.
  const hasNetwork = permissions.some((p) => p.id === 'network');
  if (hasNetwork && dataFlows.length === 0) {
    issues.push({
      path: 'dataFlows',
      message: 'network permission requires at least one dataFlow declaration',
    });
  }

  if (issues.length > 0) return err(issues);

  // Every field validated above; assemble the typed manifest explicitly so we
  // never pass unknown/extra properties through from the untrusted input.
  const manifest: PluginManifest = {
    manifestVersion: MANIFEST_VERSION,
    id: id!,
    name: name!,
    version: version!,
    description: description!,
    category: category as ToolCategory,
    entry: entry!,
    ...(author !== undefined ? { author: author as string } : {}),
    ...(icon !== undefined ? { icon: icon as string } : {}),
    ...(sensitive !== undefined ? { sensitive: sensitive as boolean } : {}),
    ...(keywords !== undefined ? { keywords: keywords as string[] } : {}),
    ...(permissions.length > 0 ? { permissions } : {}),
    ...(dataFlows.length > 0 ? { dataFlows } : {}),
  };
  return ok(manifest);
}

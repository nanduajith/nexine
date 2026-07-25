import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, NO_EGRESS_CONNECT_SRC } from './csp';

describe('buildContentSecurityPolicy', () => {
  it('enforces no network egress in production', () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toContain(NO_EGRESS_CONNECT_SRC);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
  });

  it('never allows unsafe-eval in production scripts', () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain("script-src 'self'");
  });

  it('relaxes only HMR needs in development, without touching the shipped policy', () => {
    const dev = buildContentSecurityPolicy({ dev: true });
    expect(dev).toContain('ws:');
    expect(dev).not.toContain("connect-src 'none'");

    // The production policy is unaffected by asking for a dev policy.
    expect(buildContentSecurityPolicy()).toContain(NO_EGRESS_CONNECT_SRC);
  });
});

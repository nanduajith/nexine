import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, buildSandboxDocumentCsp, NO_EGRESS_CONNECT_SRC } from './csp';

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

  describe('sandbox document policy', () => {
    it('denies the plugin all network egress', () => {
      expect(buildSandboxDocumentCsp()).toContain(NO_EGRESS_CONNECT_SRC);
    });

    it('lets the guest load self + run untrusted plugin code as a blob, nothing more', () => {
      const csp = buildSandboxDocumentCsp();
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("script-src 'self' blob:");
      expect(csp).not.toContain('unsafe-eval');
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'none'");
      expect(csp).toContain("frame-src 'none'");
    });
  });

  it('relaxes only HMR needs in development, without touching the shipped policy', () => {
    const dev = buildContentSecurityPolicy({ dev: true });
    expect(dev).toContain('ws:');
    expect(dev).not.toContain("connect-src 'none'");

    // The production policy is unaffected by asking for a dev policy.
    expect(buildContentSecurityPolicy()).toContain(NO_EGRESS_CONNECT_SRC);
  });

  it('allows desktop iframe in frame-src when desktop option is true', () => {
    const csp = buildContentSecurityPolicy({ desktop: true });
    expect(csp).toContain('nexine-sandbox:');
    expect(csp).toContain('http://nexine-sandbox.localhost');
    expect(csp).toContain("frame-src 'self'");
    // Still enforces no egress
    expect(csp).toContain(NO_EGRESS_CONNECT_SRC);
  });
});

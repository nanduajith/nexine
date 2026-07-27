import { describe, expect, it } from 'vitest';

import { isPluginPackage, envelopeFor, PACKAGE_FORMAT_VERSION, SIGNATURE_ALGORITHM, type PluginPackage } from './format';

describe('format', () => {
  const validPackage: PluginPackage = {
    format: PACKAGE_FORMAT_VERSION,
    manifest: {},
    code: 'console.log()',
    signature: {
      algorithm: SIGNATURE_ALGORITHM,
      publicKey: 'pub',
      keyId: 'kid',
      signedAt: 123,
      value: 'sig'
    }
  };

  it('validates a correct plugin package', () => {
    expect(isPluginPackage(validPackage)).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isPluginPackage(null)).toBe(false);
    expect(isPluginPackage('string')).toBe(false);
  });

  it('rejects wrong format version', () => {
    expect(isPluginPackage({ ...validPackage, format: 999 })).toBe(false);
  });

  it('rejects missing or wrong code', () => {
    expect(isPluginPackage({ ...validPackage, code: 123 as any })).toBe(false);
  });

  it('rejects missing manifest', () => {
    const { manifest: _manifest, ...noManifest } = validPackage as any;
    expect(isPluginPackage(noManifest)).toBe(false);
  });

  it('rejects malformed signature', () => {
    expect(isPluginPackage({ ...validPackage, signature: null as any })).toBe(false);
    expect(isPluginPackage({ ...validPackage, signature: { ...validPackage.signature, algorithm: 'wrong' as any } })).toBe(false);
    expect(isPluginPackage({ ...validPackage, signature: { ...validPackage.signature, publicKey: 123 as any } })).toBe(false);
    expect(isPluginPackage({ ...validPackage, signature: { ...validPackage.signature, keyId: 123 as any } })).toBe(false);
    expect(isPluginPackage({ ...validPackage, signature: { ...validPackage.signature, signedAt: '123' as any } })).toBe(false);
    expect(isPluginPackage({ ...validPackage, signature: { ...validPackage.signature, value: 123 as any } })).toBe(false);
  });

  it('generates envelopeFor', () => {
    const envelope = envelopeFor(validPackage);
    expect(envelope).toEqual({
      format: PACKAGE_FORMAT_VERSION,
      algorithm: SIGNATURE_ALGORITHM,
      publicKey: 'pub',
      keyId: 'kid',
      signedAt: 123,
      manifest: {},
      code: 'console.log()'
    });
  });
});

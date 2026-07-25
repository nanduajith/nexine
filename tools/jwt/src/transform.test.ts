import { describe, expect, it } from 'vitest';

import { decodeJwt, isExpired } from './transform';

// Standard RFC 7519 example token (HS256).
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('jwt', () => {
  it('decodes header and payload', () => {
    const result = decodeJwt(SAMPLE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(result.value.payload['sub']).toBe('1234567890');
    expect(result.value.payload['name']).toBe('John Doe');
  });

  it('rejects tokens without three segments', () => {
    expect(decodeJwt('a.b').ok).toBe(false);
  });

  it('rejects malformed base64url', () => {
    expect(decodeJwt('%%%.%%%.sig').ok).toBe(false);
  });

  it('detects expiry from the exp claim', () => {
    expect(isExpired({ exp: 1_000 }, Date.now())).toBe(true);
    expect(isExpired({ exp: Math.floor(Date.now() / 1000) + 3600 }, Date.now())).toBe(false);
    expect(isExpired({})).toBe(false);
  });
});

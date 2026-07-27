import { describe, expect, it } from 'vitest';

import { decodeJwt, isExpired } from './transform';

// Standard RFC 7519 example token (HS256).
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('jwt', () => {
  describe('decodeJwt', () => {
    it('decodes header and payload successfully', () => {
      const result = decodeJwt(SAMPLE);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(result.value.payload['sub']).toBe('1234567890');
      expect(result.value.payload['name']).toBe('John Doe');
      expect(result.value.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });

    it('rejects empty or whitespace-only tokens', () => {
      expect(decodeJwt('').ok).toBe(false);
      expect((decodeJwt('') as any).error).toBe('Enter a token to decode.');
      
      expect(decodeJwt('   ').ok).toBe(false);
      expect((decodeJwt('   ') as any).error).toBe('Enter a token to decode.');
    });

    it('rejects tokens without exactly three segments', () => {
      expect(decodeJwt('a.b').ok).toBe(false);
      expect((decodeJwt('a.b') as any).error).toBe('A JWT must have three dot-separated segments (header.payload.signature).');
      
      expect(decodeJwt('a.b.c.d').ok).toBe(false);
      expect((decodeJwt('a.b.c.d') as any).error).toBe('A JWT must have three dot-separated segments (header.payload.signature).');
    });

    it('rejects malformed base64url in header', () => {
      const result = decodeJwt('%%%.payload.sig');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Header segment is not valid Base64url.');
      }
    });

    it('rejects malformed base64url in payload', () => {
      const result = decodeJwt('eyJhbGciOiJIUzI1NiJ9.%%%.sig');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Payload segment is not valid Base64url.');
      }
    });

    it('rejects header that is not valid JSON', () => {
      const result = decodeJwt('aW52YWxpZA.payload.sig');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Header is not valid JSON');
      }
    });

    it('rejects header that is not a JSON object', () => {
      const result = decodeJwt('InN0cmluZyI.payload.sig');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Header is not a JSON object');
      }
      
      const resultNull = decodeJwt('bnVsbA.payload.sig');
      expect(resultNull.ok).toBe(false);
      if (!resultNull.ok) {
        expect(resultNull.error).toBe('Header is not a JSON object');
      }
    });

    it('rejects payload that is not valid JSON', () => {
      const result = decodeJwt('eyJhbGciOiJIUzI1NiJ9.aW52YWxpZA.sig');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Payload is not valid JSON');
      }
    });

    it('rejects payload that is not a JSON object', () => {
      const result = decodeJwt('eyJhbGciOiJIUzI1NiJ9.InN0cmluZyI.sig');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Payload is not a JSON object');
      }
    });

    it('handles base64url padding and replacements correctly', () => {
      const header = 'eyJhbGciOiJIUzI1NiJ9';
      const result = decodeJwt(`${header}.eyJmb28iOiI-XyJ9.sig`);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.payload).toEqual({ foo: '>_' });
      }
    });
  });

  describe('isExpired', () => {
    it('detects expiry from the exp claim when in the past', () => {
      expect(isExpired({ exp: 1_000 }, 1_000_001)).toBe(true);
    });

    it('returns false when exp is in the future', () => {
      expect(isExpired({ exp: 1_000 }, 999_999)).toBe(false);
    });

    it('returns false when exp is exactly now', () => {
      expect(isExpired({ exp: 1_000 }, 1_000_000)).toBe(false);
    });

    it('returns false when exp is not a number', () => {
      expect(isExpired({ exp: '1000' }, 1_000_001)).toBe(false);
    });

    it('returns false when exp is missing', () => {
      expect(isExpired({}, 1_000_001)).toBe(false);
    });

    it('uses Date.now() as default current time', () => {
      expect(isExpired({ exp: 1 })).toBe(true);
      expect(isExpired({ exp: 9_999_999_999 })).toBe(false);
    });
  });
});

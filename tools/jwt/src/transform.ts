import { err, ok, type Result } from '@nexine/core';

export interface DecodedJwt {
  readonly header: Record<string, unknown>;
  readonly payload: Record<string, unknown>;
  readonly signature: string;
}

function base64UrlDecode(segment: string): Result<string> {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return ok(new TextDecoder('utf-8').decode(bytes));
  } catch {
    return err('segment is not valid Base64url');
  }
}

function parseJsonObject(json: string, label: string): Result<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) {
      return err(`${label} is not a JSON object`);
    }
    return ok(parsed as Record<string, unknown>);
  } catch {
    return err(`${label} is not valid JSON`);
  }
}

/**
 * Decode a JWT into its header, payload, and signature — entirely locally. This
 * does NOT verify the signature (that requires a key); it is a pure structural
 * decode. Returns a Result so malformed tokens render as errors, not exceptions.
 */
export function decodeJwt(token: string): Result<DecodedJwt> {
  const trimmed = token.trim();
  if (!trimmed) return err('Enter a token to decode.');

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return err('A JWT must have three dot-separated segments (header.payload.signature).');
  }
  // Safe after the length check above.
  const [headerSeg, payloadSeg, signature] = parts as [string, string, string];

  const headerJson = base64UrlDecode(headerSeg);
  if (!headerJson.ok) return err(`Header ${headerJson.error}.`);
  const payloadJson = base64UrlDecode(payloadSeg);
  if (!payloadJson.ok) return err(`Payload ${payloadJson.error}.`);

  const header = parseJsonObject(headerJson.value, 'Header');
  if (!header.ok) return header;
  const payload = parseJsonObject(payloadJson.value, 'Payload');
  if (!payload.ok) return payload;

  return ok({ header: header.value, payload: payload.value, signature });
}

/** The registered "time" claims, in display order. */
export const TIME_CLAIMS = ['iat', 'nbf', 'exp'] as const;

/** True when the token carries an `exp` in the past. */
export function isExpired(payload: Record<string, unknown>, now: number = Date.now()): boolean {
  const exp = payload['exp'];
  return typeof exp === 'number' && exp * 1000 < now;
}

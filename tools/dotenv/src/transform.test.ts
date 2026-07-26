import { describe, expect, it } from 'vitest';

import { envToJson, jsonToEnv, parseEnv } from './transform';

const env = (input: string) => {
  const r = parseEnv(input);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('parseEnv', () => {
  it('parses basic KEY=VALUE lines', () => {
    expect(env('FOO=bar\nBAZ=qux')).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    expect(env('# a comment\n\nFOO=bar\n')).toEqual({ FOO: 'bar' });
  });

  it('strips an export prefix', () => {
    expect(env('export TOKEN=abc')).toEqual({ TOKEN: 'abc' });
  });

  it('handles quoted values with escapes', () => {
    expect(env('A="hello world"')).toEqual({ A: 'hello world' });
    expect(env('B="line1\\nline2"')).toEqual({ B: 'line1\nline2' });
    expect(env("C='raw $value #nohash'")).toEqual({ C: 'raw $value #nohash' });
  });

  it('strips inline comments from unquoted values', () => {
    expect(env('PORT=3000 # the port')).toEqual({ PORT: '3000' });
  });

  it('rejects malformed lines and bad keys', () => {
    expect(parseEnv('NOEQUALS').ok).toBe(false);
    expect(parseEnv('1BAD=x').ok).toBe(false);
    expect(parseEnv('has space=x').ok).toBe(false);
  });
});

describe('envToJson', () => {
  it('produces pretty JSON', () => {
    const r = envToJson('FOO=bar\nNUM=42');
    expect(r.ok && JSON.parse(r.value)).toEqual({ FOO: 'bar', NUM: '42' });
  });
});

describe('jsonToEnv', () => {
  it('serializes a flat object', () => {
    const r = jsonToEnv('{"FOO":"bar","NUM":42,"FLAG":true}');
    expect(r.ok && r.value).toBe('FOO=bar\nNUM=42\nFLAG=true');
  });

  it('quotes values that need it', () => {
    const r = jsonToEnv('{"MSG":"hello world","EMPTY":""}');
    expect(r.ok && r.value).toBe('MSG="hello world"\nEMPTY=""');
  });

  it('escapes newlines', () => {
    const r = jsonToEnv('{"KEY":"a\\nb"}');
    expect(r.ok && r.value).toBe('KEY="a\\nb"');
  });

  it('rejects non-objects, nested values, and bad keys', () => {
    expect(jsonToEnv('[]').ok).toBe(false);
    expect(jsonToEnv('"str"').ok).toBe(false);
    expect(jsonToEnv('{"A":{"nested":1}}').ok).toBe(false);
    expect(jsonToEnv('{"bad key":"x"}').ok).toBe(false);
    expect(jsonToEnv('not json').ok).toBe(false);
  });

  it('round-trips env → json → env', () => {
    const original = 'FOO=bar\nMSG="hello world"';
    const json = envToJson(original);
    expect(json.ok).toBe(true);
    if (!json.ok) return;
    expect(jsonToEnv(json.value)).toEqual({ ok: true, value: original });
  });
});

import { describe, it, expect } from 'vitest';

import { uuidV4, generateUuids, randomHex } from './transform';
describe('uuid', () => {
  it('v4', () => expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
  it('generateUuids valid', () => expect(generateUuids(5)).toHaveLength(5));
  it('generateUuids clamp lower', () => expect(generateUuids(0)).toHaveLength(1));
  it('generateUuids clamp upper', () => expect(generateUuids(100)).toHaveLength(50));
  it('randomHex', () => expect(randomHex(16)).toMatch(/^[0-9a-f]{32}$/));
  it('randomHex clamp lower', () => expect(randomHex(0)).toHaveLength(2));
  it('randomHex clamp upper', () => expect(randomHex(300)).toHaveLength(512));
});
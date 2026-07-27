import { describe, expect, it } from 'vitest';

import { definePlugin, PermissionDeniedError } from './api';

describe('api', () => {
  it('PermissionDeniedError has correct properties', () => {
    const err = new PermissionDeniedError('storage');
    expect(err.message).toBe("Permission denied: this plugin was not granted 'storage'.");
    expect(err.name).toBe('PermissionDeniedError');
  });

  it('definePlugin acts as identity', () => {
    const def = {
      setup: () => ({
        mount: () => {}
      })
    };
    expect(definePlugin(def)).toBe(def);
  });
});

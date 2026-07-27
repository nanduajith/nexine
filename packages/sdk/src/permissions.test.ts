import { describe, expect, it } from 'vitest';

import { isNetworkPermission, isClipboardPermission, isStoragePermission } from './permissions';

describe('permissions', () => {
  it('isNetworkPermission', () => {
    expect(isNetworkPermission({ id: 'network', hosts: [] })).toBe(true);
    expect(isNetworkPermission({ id: 'clipboard', access: 'read' })).toBe(false);
  });

  it('isClipboardPermission', () => {
    expect(isClipboardPermission({ id: 'clipboard', access: 'read' })).toBe(true);
    expect(isClipboardPermission({ id: 'network', hosts: [] })).toBe(false);
  });

  it('isStoragePermission', () => {
    expect(isStoragePermission({ id: 'storage' })).toBe(true);
    expect(isStoragePermission({ id: 'network', hosts: [] })).toBe(false);
  });
});

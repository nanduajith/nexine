import { describe, expect, it } from 'vitest';

import { convertCase } from './transform';

describe('case', () => {
  it('converts space-separated words', () => {
    expect(convertCase('hello world foo', 'snake')).toBe('hello_world_foo');
    expect(convertCase('hello world foo', 'kebab')).toBe('hello-world-foo');
    expect(convertCase('hello world foo', 'constant')).toBe('HELLO_WORLD_FOO');
  });

  it('splits camelCase and PascalCase input', () => {
    expect(convertCase('myVariableName', 'snake')).toBe('my_variable_name');
    expect(convertCase('XMLHttpRequest', 'kebab')).toBe('xml-http-request');
  });

  it('produces camel and pascal', () => {
    expect(convertCase('foo-bar baz', 'camel')).toBe('fooBarBaz');
    expect(convertCase('foo-bar baz', 'pascal')).toBe('FooBarBaz');
  });

  it('handles empty input', () => {
    expect(convertCase('   ', 'camel')).toBe('');
  });
});

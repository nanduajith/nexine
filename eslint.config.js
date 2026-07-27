// Flat ESLint config (ESLint 9). Enforces strict typing, import hygiene,
// and — critically — architectural boundaries (the domain core must stay
// framework-free and must never import UI or host code).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      'src-tauri/target/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Node-side build scripts (plain ESM, not part of the app/type program).
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', URL: 'readonly' },
    },
  },
  // The standalone documentation site (site/) is vanilla browser JS — not part
  // of the TypeScript app program, so it gets browser globals here.
  {
    files: ['site/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        IntersectionObserver: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      import: importPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='eval']",
          message: 'eval() is forbidden — Nexine is a security-first product.',
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: { project: ['packages/*/tsconfig.json', 'tools/*/tsconfig.json'] },
      },
    },
  },
  // Architectural boundary: the domain core stays pure. No UI, no React, no host.
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', '@nexine/ui', '@nexine/host', '**/host/**'],
              message:
                '@nexine/core is framework-free domain logic — it must not depend on UI, React, or the host.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-useless-escape': 'off',
    },
  },
);


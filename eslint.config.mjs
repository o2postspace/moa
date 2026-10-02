import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  { ignores: ['node_modules/**', 'dist/**', '.expo/**', 'src/app/**', 'src/components/**', 'src/features/**', 'src/theme/**', 'expo-env.d.ts'] },
  {
    files: ['src/web/**/*.{ts,tsx}', 'src/domain/**/*.ts', 'server/**/*.ts', 'tests/**/*.ts', 'vite.config.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: { '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }] },
  },
  {
    // These boundary checks deliberately reject control characters in input.
    files: ['src/domain/imports.ts', 'server/api.ts', 'src/web/lib/api.ts'],
    rules: { 'no-control-regex': 'off' },
  },
  {
    files: ['src/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' },
  },
  {
    files: ['server/**/*.ts', 'tests/**/*.ts', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', 'eslint.config.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
]);

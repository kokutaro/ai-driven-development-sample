import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { FlatCompat } from '@eslint/eslintrc'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import perfectionist from 'eslint-plugin-perfectionist'
import securityPlugin from 'eslint-plugin-security'
import unicornPlugin from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = tseslint.config(
  ...compat.extends('next/core-web-vitals'),
  {
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { fixStyle: 'inline-type-imports', prefer: 'type-imports' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/require-await': 'off',
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
          },
          groups: [
            'builtin',
            'external',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          pathGroups: [
            {
              group: 'builtin',
              pattern: '{react,react-dom/**,react-router-dom}',
              position: 'before',
            },
            {
              group: 'parent',
              pattern: '@src/**',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
    },
  },
  {
    extends: [unicornPlugin.configs.recommended],
    rules: {
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    extends: [perfectionist.configs['recommended-natural']],
    rules: {
      'perfectionist/sort-imports': 'off',
    },
  },
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    extends: [securityPlugin.configs.recommended],
  },
  {
    rules: {
      'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
      'prefer-template': 'error',
    },
  },
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/public/**',
      '**/coverage/**',
    ],
  }
)

export default eslintConfig

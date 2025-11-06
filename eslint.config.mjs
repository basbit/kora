import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import complexityPlugin from 'eslint-plugin-complexity';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      '/dist/*',
      'node_modules/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      '*.d.ts',
      '*.generated.*',
      '*.min.*',
      'coverage/**',
      '*.log',
      '*.tmp',
      '*.temp',
    ],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      complexity: complexityPlugin,
      'unused-imports': unusedImportsPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      react: {
        version: 'detect',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      'comma-dangle': ['error', 'always-multiline'],
      'react/jsx-closing-bracket-location': [1, 'tag-aligned'],
      'react/jsx-props-no-spreading': 'warn',
      'react-hooks/exhaustive-deps': 'off',
      complexity: ['error', 15],
      'eol-last': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-dynamic-delete': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }
      ],
      // Отключаем правила ESLint, которые конфликтуют с Prettier
      'arrow-parens': 'off',
      'bracket-spacing': 'off',
      'comma-dangle': 'off',
      'comma-spacing': 'off',
      'indent': 'off',
      'key-spacing': 'off',
      'keyword-spacing': 'off',
      'object-curly-spacing': 'off',
      'quotes': 'off',
      'semi': 'off',
      'space-before-blocks': 'off',
      'space-before-function-paren': 'off',
      'space-in-parens': 'off',
      'space-infix-ops': 'off',
      'space-unary-ops': 'off',
      'template-curly-spacing': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            { pattern: '@/**', group: 'internal', position: 'after' },
            { pattern: '@shared/**', group: 'internal', position: 'after' },
            { pattern: '@entities/**', group: 'internal', position: 'after' },
            { pattern: '@features/**', group: 'internal', position: 'after' },
            { pattern: '@widgets/**', group: 'internal', position: 'after' },
            { pattern: '@pages/**', group: 'internal', position: 'after' },
            { pattern: '@app/**', group: 'internal', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    files: ['**/effects.ts', '**/assets/**', '**/components/**'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/*.smoke.test.tsx'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      '@typescript-eslint/unified-signatures': 'off',
    },
  },
];

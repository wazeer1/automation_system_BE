'use strict';

module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended-legacy',
    'plugin:jest/recommended',
  ],
  plugins: ['import', 'security', 'jest'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
  rules: {
    // Style
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],

    // Node
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-require': 'error',

    // Import order
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],
    'import/no-duplicates': 'error',

    // Security
    'security/detect-object-injection': 'off',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',

    // Jest
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/prefer-expect-assertions': 'off',
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      env: { jest: true },
      rules: { 'node/no-unpublished-require': 'off' },
    },
  ],
  ignorePatterns: ['node_modules/', 'coverage/', 'src/logs/'],
};

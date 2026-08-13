import vue from 'eslint-plugin-vue';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import eslint from '@eslint/js';

export default [// Global Ignores (replaces ignorePatterns)
  {
    ignores: ['src/shoppinglist/*'],
  },

  // Base JS rules
  eslint.configs.recommended,

  // Vue 3 Recommended rules
  ...vue.configs['flat/recommended'],

  // TypeScript & Vue File Handling
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'], languageOptions: {
      ecmaVersion: 2020, sourceType: 'module', parser: vueParser, parserOptions: {
        parser: typescriptParser, ecmaVersion: 2020, sourceType: 'module',
      }, globals: {
        // Replaces env.browser and env.node
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    }, plugins: {
      '@typescript-eslint': typescriptEslint,
    }, // Replaces settings.import/resolver for TypeScript resolution
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', './src']], extensions: ['.ts', '.vue'],
        },
      },
    }, rules: {
      // TypeScript recommended subset overrides
      ...typescriptEslint.configs.recommended.rules,

      // Custom Rules from your original setup
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      quotes: ['error', 'single'],
      'space-before-function-paren': 'off',
      'max-len': ['error', 200],
      'class-methods-use-this': 'off',
      'lines-between-class-members': 'off',
      'no-plusplus': 'off',
      'no-shadow': 'off',
      'import/extensions': 'off',
      'linebreak-style': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'vue/max-attributes-per-line': 'off',
    },
  },
];

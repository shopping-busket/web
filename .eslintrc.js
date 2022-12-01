module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    /* 'plugin:vue/vu3-essential',
    'plugin:vue/vue3-recommended',
    '@vue/airbnb',
    '@vue/typescript/recommended', */
    // '@vue/eslint-config-airbnb',
    // '@vue/typescript/recommended',

    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  ignorePatterns: ['src/shoppinglist/*'],
  rules: {
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
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src'],
        ],
        extensions: ['.ts', '.vue'],
      },
    },
  },
};

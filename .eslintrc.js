module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
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
    '@typescript-eslint/no-shadow': 'error',
    "linebreak-style": "off"
  },
};

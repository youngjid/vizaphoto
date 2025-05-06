module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
  ],
  rules: {
    'semi': ['error', 'never'],
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
};

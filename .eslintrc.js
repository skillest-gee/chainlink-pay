module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable strict rules for production build
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-useless-escape': 'warn',
    'no-eval': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  },
  env: {
    browser: true,
    node: true,
    es6: true
  }
};

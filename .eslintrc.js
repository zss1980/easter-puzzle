module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  ignorePatterns: ['apps/**/dist', 'apps/**/build', 'node_modules', '.turbo', 'dist/', 'build/'],
  rules: {
    'prettier/prettier': 'warn', // Show Prettier issues as warnings
  },
};

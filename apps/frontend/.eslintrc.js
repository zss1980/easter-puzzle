module.exports = {
  root: false, // Important: ESLint will stop searching for configs in parent folders
  env: {
    browser: true,
    es2021: true,
    node: true, // Keep node true if you have config files like vite.config.ts
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended', // Accessibility rules
    'plugin:@typescript-eslint/recommended', // If using TypeScript
    'prettier', // Make sure this is last
  ],
  parser: '@typescript-eslint/parser', // If using TypeScript
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
    project: './tsconfig.json', // Path to your frontend tsconfig.json
  },
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
    '@typescript-eslint', // If using TypeScript
    'prettier',
  ],
  settings: {
    react: {
      version: 'detect', // Automatically detects the React version
    },
  },
  rules: {
    'prettier/prettier': 'warn',
    'react/react-in-jsx-scope': 'off', // Not needed for React 17+ with new JSX transform
    'react/prop-types': 'off', // Disable prop-types as we use TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Add any frontend-specific rules here
  },
  ignorePatterns: ['dist/', 'build/', 'node_modules/', '*.config.js', '*.config.ts'],
};

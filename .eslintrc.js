module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  extends: ['plugin:prettier/recommended', 'airbnb-base', 'airbnb-typescript/base', 'prettier'],
  root: true,
  env: {
    node: true,
    jest: true,
    commonjs: true,
    es6: true
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never'
      }
    ],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': 'error',
    'import/prefer-default-export': 'off',
    'no-return-await': 'error',
    'import/prefer-default-export': 'off',
    'no-return-await': 0,
    'no-param-reassign': 0,
    'class-methods-use-this': 0,
    'trailing-comma': 0
  }
};

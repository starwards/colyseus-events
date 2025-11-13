module.exports = {
    env: {
        es6: true,
    },
    extends: ['eslint:recommended', 'prettier'],
    parser: '@typescript-eslint/parser',
    plugins: ['no-only-tests', 'prettier'],
    rules: {
        'no-shadow': 'error',
        'sort-imports': 'error',
        'no-only-tests/no-only-tests': 'error',
        'no-console': 'error',
        'prettier/prettier': 'error',
    },
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            parserOptions: {
                project: './tsconfig.json',
            },
            extends: [
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/recommended-requiring-type-checking',
                'prettier',
            ],
            rules: {
                'no-shadow': 'off',
                '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
                '@typescript-eslint/no-shadow': 'error',
                '@typescript-eslint/explicit-module-boundary-types': 'off',
                '@typescript-eslint/no-use-before-define': 'off',
                '@typescript-eslint/no-unused-vars': 'off',
                // note you must disable the base rule as it can report incorrect errors
                'init-declarations': 'off',
                '@typescript-eslint/init-declarations': ['error', 'always'],
            },
        },
    ],
};

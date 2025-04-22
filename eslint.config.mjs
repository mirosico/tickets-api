// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import importAliasPlugin from 'eslint-plugin-import-alias';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      import: importPlugin,
      'import-alias': importAliasPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import/no-unresolved': 'error',
      'import-alias/import-alias': [
        'error',
        {
          alias: {
            '@auth/*': 'src/auth/*',
            '@carts/*': 'src/carts/*',
            '@concerts/*': 'src/concerts/*',
            '@notifications/*': 'src/notifications/*',
            '@orders/*': 'src/orders/*',
            '@users/*': 'src/users/*',
            '@tickets/*': 'src/tickets/*',
            '@utils/*': 'src/shared/utils/*',
            '@utils': 'src/shared/utils',
            '@schemas/*': 'src/shared/schemas/*',
            '@types/*': 'src/shared/types/*',
            '@types': 'src/shared/types',
            '@services/*': 'src/shared/services/*',
            '@shared/*': 'src/shared/*',
          },
          checkSourceFilePattern: '**/*.{ts,tsx}',
          relativeDepth: 1,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['src/*'],
              message:
                'Використовуйте path alias замість прямих шляхів (наприклад, @notifications/* замість src/notifications/*)',
            },
          ],
        },
      ],
      //'import/no-relative-parent-imports': 'error',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
);

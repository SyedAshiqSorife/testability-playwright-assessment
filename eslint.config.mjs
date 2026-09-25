import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['node_modules/', 'reports/', 'test-results/', '.auth/'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // A forgotten `await` on a Playwright call is the most common cause of flaky tests.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      // `response.json()` is untyped by design; payloads are typed where they are consumed.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/no-raw-locators': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-nested-step': 'off',
      // False positive for page objects: it flags `editorPage.fill()` as if it were `page.fill()`.
      'playwright/prefer-locator': 'off',
      // Assertions live in page-object helpers (e.g. expectArticle) and in steps.
      'playwright/expect-expect': [
        'error',
        {
          assertFunctionNames: [
            'expectSignedInAs',
            'expectSignedOut',
            'expectArticle',
            'expectPrefilledWith',
            'expectActiveFeed',
          ],
        },
      ],
    },
  },
  {
    // Fixture callbacks use Playwright's required `({}, use)` signature.
    files: ['src/fixtures/**/*.ts', 'tests/**/*.setup.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);

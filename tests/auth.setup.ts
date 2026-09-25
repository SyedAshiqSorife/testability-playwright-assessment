import { test as setup, expect } from '@playwright/test';
import { ConduitApi } from '../src/api/ConduitApi';
import { buildUser } from '../src/data/factories';
import { LoginPage } from '../src/pages/LoginPage';
import { JWT_STORAGE_KEY, saveSessionUser, STORAGE_STATE } from '../src/utils/session';

/**
 * Runs once per `npx playwright test` invocation, before all browser projects:
 * registers a throwaway user, signs in through the real login form and persists
 * the session. Every test then starts already authenticated.
 */
setup('authenticate session user', async ({ page }) => {
  const credentials = buildUser();

  await setup.step('register a fresh user via API', async () => {
    const api = await ConduitApi.create();
    await api.register(credentials);
    await api.dispose();
  });

  await setup.step('sign in through the UI', async () => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    const response = await loginPage.signIn(credentials.email, credentials.password);
    expect(response.status()).toBe(200);
    await expect(page).toHaveURL('/');
    await loginPage.header.expectSignedInAs(credentials.username);
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), JWT_STORAGE_KEY)).toBeTruthy();
  });

  await page.context().storageState({ path: STORAGE_STATE });
  saveSessionUser({ username: credentials.username, email: credentials.email });
});

import { test as base, expect } from '@playwright/test';
import { ConduitApi } from '../api/ConduitApi';
import type { SessionUser, User } from '../api/types';
import { buildUser } from '../data/factories';
import { ArticlePage } from '../pages/ArticlePage';
import { EditorPage } from '../pages/EditorPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import { readSessionUser, storageStateFor } from '../utils/session';
import { ArticleFactory } from './ArticleFactory';

interface RegisteredUser extends User {
  password: string;
  api: ConduitApi;
}

type Fixtures = {
  /** The user whose persisted session (storageState) every browser context starts with. */
  sessionUser: SessionUser;
  /** API client authenticated as `sessionUser`. */
  api: ConduitApi;
  /** Creates articles as `sessionUser` and cleans them up after the test. */
  articles: ArticleFactory;
  /** A second, freshly registered user — e.g. an author whose content `sessionUser` must not touch. */
  otherUser: RegisteredUser;
  /** Articles owned by `otherUser`, cleaned up after the test. */
  otherUserArticles: ArticleFactory;

  homePage: HomePage;
  loginPage: LoginPage;
  editorPage: EditorPage;
  articlePage: ArticlePage;
  settingsPage: SettingsPage;
  profilePage: ProfilePage;
};

async function registerUser(): Promise<RegisteredUser> {
  const anonymous = await ConduitApi.create();
  const credentials = buildUser();
  const user = await anonymous.register(credentials);
  await anonymous.dispose();
  return { ...user, password: credentials.password, api: await ConduitApi.create(user.token) };
}

export const test = base.extend<Fixtures>({
  sessionUser: async ({}, use) => {
    await use(readSessionUser());
  },
  api: async ({ sessionUser }, use) => {
    const api = await ConduitApi.create(sessionUser.token);
    await use(api);
    await api.dispose();
  },
  articles: async ({ api }, use) => {
    const factory = new ArticleFactory(api);
    await use(factory);
    await factory.cleanup();
  },
  otherUser: async ({}, use) => {
    const user = await registerUser();
    await use(user);
    await user.api.dispose();
  },
  otherUserArticles: async ({ otherUser }, use) => {
    const factory = new ArticleFactory(otherUser.api);
    await use(factory);
    await factory.cleanup();
  },

  homePage: async ({ page }, use) => use(new HomePage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  editorPage: async ({ page }, use) => use(new EditorPage(page)),
  articlePage: async ({ page }, use) => use(new ArticlePage(page)),
  settingsPage: async ({ page }, use) => use(new SettingsPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),
});

/**
 * Variant for tests that mutate the account itself (username, email, password).
 * Each test gets its own throwaway user, signed in by injecting its JWT — no UI
 * login — so the shared session user is never changed under parallel tests.
 */
export const isolatedUserTest = test.extend<{ isolatedUser: RegisteredUser }>({
  isolatedUser: async ({}, use) => {
    const user = await registerUser();
    await use(user);
    await user.api.dispose();
  },
  sessionUser: async ({ isolatedUser }, use) => {
    await use({ username: isolatedUser.username, email: isolatedUser.email, token: isolatedUser.token });
  },
  storageState: async ({ isolatedUser }, use) => {
    await use(storageStateFor(isolatedUser.token));
  },
});

export { expect };

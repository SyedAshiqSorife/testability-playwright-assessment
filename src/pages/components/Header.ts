import { expect, type Locator, type Page } from '@playwright/test';

export class Header {
  readonly root: Locator;
  readonly homeLink: Locator;
  readonly newArticleLink: Locator;
  readonly settingsLink: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.root = page.locator('app-layout-header nav');
    this.homeLink = this.root.getByRole('link', { name: 'Home' });
    this.newArticleLink = this.root.getByRole('link', { name: /new article/i });
    this.settingsLink = this.root.getByRole('link', { name: /settings/i });
    this.signInLink = this.root.getByRole('link', { name: /sign in/i });
  }

  profileLink(username: string): Locator {
    return this.root.getByRole('link', { name: username, exact: true });
  }

  async expectSignedInAs(username: string): Promise<void> {
    await expect(this.profileLink(username)).toBeVisible();
    await expect(this.newArticleLink).toBeVisible();
    await expect(this.signInLink).toBeHidden();
  }

  async expectSignedOut(): Promise<void> {
    await expect(this.signInLink).toBeVisible();
    await expect(this.newArticleLink).toBeHidden();
  }
}

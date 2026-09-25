import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { ApiResponse } from '../api/endpoints';
import type { UserSettings } from '../api/types';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly username: Locator;
  readonly bio: Locator;
  readonly avatar: Locator;
  readonly editSettingsLink: Locator;
  readonly articleTitles: Locator;

  constructor(page: Page) {
    super(page);
    const root = page.locator('app-profile-page');
    const info = root.locator('.user-info');
    this.username = info.getByRole('heading', { level: 4 });
    this.bio = info.getByRole('paragraph');
    this.avatar = info.getByRole('img');
    this.editSettingsLink = info.getByRole('link', { name: /edit profile settings/i });
    this.articleTitles = root.locator('app-article-preview .preview-link').getByRole('heading', { level: 1 });
  }

  /** Opens a profile and resolves once that author's article list has loaded. */
  async open(username: string): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(ApiResponse.listArticles({ author: username })),
      this.visit(`/profile/${encodeURIComponent(username)}`),
    ]);
    return response;
  }

  articleTitle(title: string): Locator {
    return this.articleTitles.filter({ hasText: title });
  }

  /** Soft assertions: every mismatching profile field is reported. */
  async expectProfile({ username, bio, image }: Pick<UserSettings, 'username' | 'bio' | 'image'>): Promise<void> {
    if (username) await expect.soft(this.username).toHaveText(username);
    if (bio) await expect.soft(this.bio).toHaveText(bio);
    if (image) await expect.soft(this.avatar).toHaveAttribute('src', image);
  }
}

import type { Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly username: Locator;
  readonly bio: Locator;
  readonly avatar: Locator;
  readonly editSettingsLink: Locator;
  readonly articleTitles: Locator;

  constructor(page: Page) {
    super(page);
    const info = page.locator('app-profile-page .user-info');
    this.username = info.getByRole('heading', { level: 4 });
    this.bio = info.locator('p');
    this.avatar = info.locator('img.user-img');
    this.editSettingsLink = info.getByRole('link', { name: /edit profile settings/i });
    this.articleTitles = page.locator('app-profile-page app-article-preview .preview-link h1');
  }

  /** Opens a profile and resolves once that author's article list has loaded. */
  async open(username: string): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/articles?') && new URL(r.url()).searchParams.get('author') === username,
      ),
      this.visit(`/profile/${encodeURIComponent(username)}`),
    ]);
    return response;
  }
}

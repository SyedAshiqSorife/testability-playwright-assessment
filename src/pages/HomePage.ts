import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { BasePage } from './BasePage';
import { exactText } from '../utils/text';

export class HomePage extends BasePage {
  readonly feedTabs: Locator;
  readonly globalFeedTab: Locator;
  readonly activeFeedTab: Locator;
  readonly popularTags: Locator;
  readonly articlePreviews: Locator;
  readonly emptyFeedMessage: Locator;

  constructor(page: Page) {
    super(page);
    const root = page.locator('app-home-page');
    this.feedTabs = root.locator('.feed-toggle .nav-link');
    this.globalFeedTab = this.feedTabs.filter({ hasText: 'Global Feed' });
    this.activeFeedTab = root.locator('.feed-toggle .nav-link.active');
    this.popularTags = root.locator('.sidebar .tag-list .tag-pill');
    this.articlePreviews = root.locator('app-article-preview .article-preview');
    this.emptyFeedMessage = root.getByText(/no articles are here/i);
  }

  /**
   * Opens the home page and waits for the initial feed. The app does not cancel stale
   * feed requests, so clicking a tag before this lands lets the late global feed
   * overwrite the filtered list.
   */
  async open(): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith('/api/articles') && r.request().method() === 'GET'),
      this.visit('/'),
    ]);
    await expect(this.articlePreviews.or(this.emptyFeedMessage).first()).toBeVisible();
  }

  popularTag(tag: string): Locator {
    return this.popularTags.filter({ hasText: exactText(tag) });
  }

  previewTitles(): Locator {
    return this.articlePreviews.locator('.preview-link h1');
  }

  previewTags(preview: Locator): Locator {
    return preview.locator('.tag-list li');
  }

  /** Clicks a sidebar tag and resolves with the filtered-articles API response. */
  async filterByTag(tag: string): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/articles?') && new URL(r.url()).searchParams.get('tag') === tag,
      ),
      this.popularTag(tag).click(),
    ]);
    return response;
  }
}

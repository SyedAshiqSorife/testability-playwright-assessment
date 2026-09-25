import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { ApiResponse } from '../api/endpoints';
import { Messages } from '../data/messages';
import { exactText } from '../utils/text';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly feedTabs: Locator;
  readonly globalFeedTab: Locator;
  readonly popularTags: Locator;
  readonly articlePreviews: Locator;
  readonly emptyFeedMessage: Locator;
  /**
   * The app marks the selected feed only with an `active` class (no aria-selected/aria-current).
   * The tag tab is always in the DOM, hidden and `active`, when no tag is selected, so only visible tabs count.
   */
  private readonly activeFeedTab: Locator;

  constructor(page: Page) {
    super(page);
    const root = page.locator('app-home-page');
    this.feedTabs = root.locator('.feed-toggle').getByRole('listitem');
    this.globalFeedTab = this.feedTabs.filter({ hasText: 'Global Feed' });
    this.activeFeedTab = root.locator('.feed-toggle .nav-link.active').filter({ visible: true });
    this.popularTags = root.locator('.sidebar .tag-list .tag-pill');
    this.articlePreviews = root.locator('app-article-preview');
    this.emptyFeedMessage = root.getByText(Messages.feed.empty);
  }

  /**
   * Opens the home page and waits for the initial feed. The app does not cancel stale
   * feed requests, so clicking a tag before this lands lets the late global feed
   * overwrite the filtered list.
   */
  async open(): Promise<void> {
    await Promise.all([this.page.waitForResponse(ApiResponse.listArticles()), this.visit('/')]);
    await expect(this.articlePreviews.or(this.emptyFeedMessage).first()).toBeVisible();
  }

  popularTag(tag: string): Locator {
    return this.popularTags.filter({ hasText: exactText(tag) });
  }

  feedTab(name: string): Locator {
    return this.feedTabs.filter({ hasText: exactText(name) });
  }

  previewTitles(): Locator {
    return this.articlePreviews.locator('.preview-link').getByRole('heading', { level: 1 });
  }

  previewTags(preview: Locator): Locator {
    return preview.locator('.tag-list').getByRole('listitem');
  }

  /** Clicks a sidebar tag and resolves with the filtered-articles API response. */
  async filterByTag(tag: string): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(ApiResponse.listArticles({ tag })),
      this.popularTag(tag).click(),
    ]);
    return response;
  }

  /** Exactly one feed tab is selected, and it is `name`. */
  async expectActiveFeed(name: string): Promise<void> {
    await expect(this.activeFeedTab).toHaveCount(1);
    await expect(this.activeFeedTab).toHaveText(name);
  }
}

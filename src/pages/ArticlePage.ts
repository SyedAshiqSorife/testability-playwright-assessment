import { expect, type Locator, type Page, type Response } from '@playwright/test';
import type { ArticleInput } from '../api/types';
import { BasePage } from './BasePage';

export class ArticlePage extends BasePage {
  readonly title: Locator;
  readonly body: Locator;
  readonly tags: Locator;
  readonly authorLink: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly favoriteButton: Locator;
  readonly followButton: Locator;

  constructor(page: Page) {
    super(page);
    const root = page.locator('app-article-page');
    const bannerMeta = root.locator('.banner .article-meta');
    this.title = root.locator('.banner').getByRole('heading', { level: 1 });
    this.body = root.locator('.article-content [class^="col"] > div').first();
    this.tags = root.locator('.article-content .tag-list li');
    this.authorLink = bannerMeta.locator('a.author');
    // Edit/Delete render twice (banner + footer); the banner ones are the primary controls.
    this.editButton = bannerMeta.getByRole('link', { name: /edit article/i });
    this.deleteButton = bannerMeta.getByRole('button', { name: /delete article/i });
    this.favoriteButton = bannerMeta.getByRole('button', { name: /favorite article/i });
    this.followButton = bannerMeta.getByRole('button', { name: /follow/i });
  }

  async open(slug: string): Promise<void> {
    await this.visit(`/article/${slug}`);
    await expect(this.title).toBeVisible();
  }

  async delete(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/articles/') && r.request().method() === 'DELETE'),
      this.deleteButton.click(),
    ]);
    return response;
  }

  async expectArticle(article: ArticleInput, author: string): Promise<void> {
    await expect(this.title).toHaveText(article.title);
    await expect(this.authorLink).toHaveText(author);
    await expect(this.tags).toHaveText(article.tagList);
    await this.expectRenderedMarkdown(article.body);
  }

  /** The body is authored in markdown, so the page must render it (no raw `##` / `**`). */
  async expectRenderedMarkdown(markdown: string): Promise<void> {
    const heading = markdown.match(/^##\s+(.+)$/m)?.[1];
    const bold = markdown.match(/\*\*(.+?)\*\*/)?.[1];
    if (heading) await expect(this.body.getByRole('heading', { level: 2 })).toHaveText(heading);
    if (bold) await expect(this.body.locator('strong')).toHaveText(bold);
    await expect(this.body).not.toContainText('**');
  }
}

import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { ApiResponse } from '../api/endpoints';
import type { ArticleInput } from '../api/types';
import { BasePage } from './BasePage';

export class ArticlePage extends BasePage {
  readonly title: Locator;
  /** Rendered article body together with its tag list. */
  readonly content: Locator;
  readonly tags: Locator;
  readonly authorLink: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly followButton: Locator;

  constructor(page: Page) {
    super(page);
    const root = page.locator('app-article-page');
    const banner = root.locator('.banner');
    // Author meta and Edit/Delete render twice (banner + footer); the banner copy is the primary one.
    const bannerMeta = banner.locator('app-article-meta');
    this.title = banner.getByRole('heading', { level: 1 });
    this.content = root.locator('.article-content');
    // Scoped to the tag list: the markdown body can contain list items of its own.
    this.tags = this.content.locator('.tag-list').getByRole('listitem');
    this.authorLink = bannerMeta.locator('a.author');
    this.editButton = bannerMeta.getByRole('link', { name: /edit article/i });
    this.deleteButton = bannerMeta.getByRole('button', { name: /delete article/i });
    this.followButton = bannerMeta.getByRole('button', { name: /follow/i });
  }

  /** Navigates to an article URL without assuming it exists. */
  async visit(slug: string): Promise<void> {
    await super.visit(`/article/${slug}`);
  }

  /** Opens an existing article and waits for it to render. */
  async open(slug: string): Promise<void> {
    await this.visit(slug);
    await expect(this.title).toBeVisible();
  }

  async delete(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(ApiResponse.deleteArticle),
      this.deleteButton.click(),
    ]);
    return response;
  }

  /** Soft assertions: every mismatching field is reported, not just the first. */
  async expectArticle(article: ArticleInput, author: string): Promise<void> {
    await expect(this.title).toHaveText(article.title);
    await expect.soft(this.authorLink).toHaveText(author);
    await expect.soft(this.tags).toHaveText(article.tagList);
    await this.expectRenderedMarkdown(article.body);
  }

  /** The body is authored in markdown, so the page must render it (no raw `##` / `**`). */
  async expectRenderedMarkdown(markdown: string): Promise<void> {
    const heading = /^##\s+(.+)$/m.exec(markdown)?.[1];
    const bold = /\*\*(.+?)\*\*/.exec(markdown)?.[1];
    if (heading) await expect.soft(this.content.getByRole('heading', { level: 2 })).toHaveText(heading);
    if (bold) await expect.soft(this.content.locator('strong')).toHaveText(bold);
    await expect.soft(this.content).not.toContainText('**');
  }
}

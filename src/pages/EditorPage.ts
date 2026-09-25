import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { ApiResponse } from '../api/endpoints';
import type { ArticleInput } from '../api/types';
import { exactText } from '../utils/text';
import { BasePage } from './BasePage';

export class EditorPage extends BasePage {
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly bodyInput: Locator;
  readonly tagInput: Locator;
  readonly tagPills: Locator;
  readonly publishButton: Locator;

  constructor(page: Page) {
    super(page);
    const form = page.locator('app-editor-page form');
    this.titleInput = form.getByPlaceholder('Article Title');
    this.descriptionInput = form.getByPlaceholder(/what's this article about/i);
    this.bodyInput = form.getByPlaceholder(/write your article/i);
    this.tagInput = form.getByPlaceholder('Enter tags');
    this.tagPills = form.locator('.tag-list .tag-pill');
    this.publishButton = form.getByRole('button', { name: /publish article/i });
  }

  async openNew(): Promise<void> {
    await this.visit('/editor');
  }

  async openExisting(slug: string): Promise<void> {
    await this.visit(`/editor/${slug}`);
  }

  tagPill(tag: string): Locator {
    return this.tagPills.filter({ hasText: exactText(tag) });
  }

  async addTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.tagInput.fill(tag);
      await this.tagInput.press('Enter');
      await expect(this.tagPill(tag)).toBeVisible();
    }
  }

  /** Fills only the provided fields, replacing existing values. */
  async fill(article: Partial<ArticleInput>): Promise<void> {
    if (article.title !== undefined) await this.titleInput.fill(article.title);
    if (article.description !== undefined) await this.descriptionInput.fill(article.description);
    if (article.body !== undefined) await this.bodyInput.fill(article.body);
    if (article.tagList?.length) await this.addTags(article.tagList);
  }

  /** Clicks publish and resolves with the create (`POST`) or update (`PUT`) API response. */
  async publish(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => ApiResponse.createArticle(r) || ApiResponse.updateArticle(r)),
      this.publishButton.click(),
    ]);
    return response;
  }

  /** Soft assertions: a mismatch in one field still reports the others. */
  async expectPrefilledWith(article: ArticleInput): Promise<void> {
    await expect(this.titleInput).toHaveValue(article.title);
    await expect.soft(this.descriptionInput).toHaveValue(article.description);
    await expect.soft(this.bodyInput).toHaveValue(article.body);
    for (const tag of article.tagList) await expect.soft(this.tagPill(tag)).toBeVisible();
  }
}

import type { ConduitApi } from '../api/ConduitApi';
import type { Article, ArticleInput } from '../api/types';
import { buildArticle } from '../data/factories';

/**
 * Creates articles via the API as test pre-conditions and deletes whatever is
 * still around when the test ends, so the shared demo backend stays clean.
 */
export class ArticleFactory {
  private readonly slugs = new Set<string>();

  constructor(private readonly api: ConduitApi) {}

  async create(overrides: Partial<ArticleInput> = {}): Promise<Article> {
    const article = await this.api.createArticle(buildArticle(overrides));
    this.track(article.slug);
    return article;
  }

  /** Registers an article created through the UI (or re-slugged by an edit) for cleanup. */
  track(slug: string): void {
    this.slugs.add(slug);
  }

  async cleanup(): Promise<void> {
    // Already-deleted articles return 404, which is fine.
    await Promise.allSettled([...this.slugs].map((slug) => this.api.deleteArticleRaw(slug)));
    this.slugs.clear();
  }
}

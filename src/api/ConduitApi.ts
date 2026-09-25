import { expect, request, type APIRequestContext, type APIResponse } from '@playwright/test';
import { env } from '../config/env';
import { withApiRetry } from '../utils/retry';
import type { Article, ArticleInput, ArticleList, NewUser, Profile, User, UserSettings } from './types';

/**
 * Thin client over the Conduit REST API, used for test pre-conditions, cleanup and
 * back-end verification of what the UI claims to have done.
 *
 * `*Raw` methods return the untouched response so negative tests can assert on
 * status codes; the others assert success and return the parsed payload.
 */
export class ConduitApi {
  private constructor(
    private readonly http: APIRequestContext,
    readonly token?: string,
  ) {}

  static async create(token?: string): Promise<ConduitApi> {
    const http = await request.newContext({
      baseURL: `${env.apiUrl}/`,
      extraHTTPHeaders: token ? { Authorization: `Token ${token}` } : {},
    });
    return new ConduitApi(http, token);
  }

  async dispose(): Promise<void> {
    await this.http.dispose();
  }

  // ---------- users ----------

  async register(user: NewUser): Promise<User> {
    const response = await withApiRetry(() => this.http.post('users', { data: { user } }));
    return (await this.expectOk(response, 'register user')).user;
  }

  async login(email: string, password: string): Promise<APIResponse> {
    return withApiRetry(() => this.http.post('users/login', { data: { user: { email, password } } }));
  }

  async currentUser(): Promise<User> {
    const response = await withApiRetry(() => this.http.get('user'));
    return (await this.expectOk(response, 'get current user')).user;
  }

  async updateUserRaw(settings: UserSettings): Promise<APIResponse> {
    return this.http.put('user', { data: { user: settings } });
  }

  async profile(username: string): Promise<Profile> {
    const response = await withApiRetry(() => this.http.get(`profiles/${encodeURIComponent(username)}`));
    return (await this.expectOk(response, 'get profile')).profile;
  }

  // ---------- articles ----------

  async createArticle(article: ArticleInput): Promise<Article> {
    const response = await withApiRetry(() => this.http.post('articles', { data: { article } }));
    return (await this.expectOk(response, 'create article')).article;
  }

  async getArticleRaw(slug: string): Promise<APIResponse> {
    return withApiRetry(() => this.http.get(`articles/${slug}`));
  }

  async getArticle(slug: string): Promise<Article> {
    return (await this.expectOk(await this.getArticleRaw(slug), 'get article')).article;
  }

  async updateArticleRaw(slug: string, article: Partial<ArticleInput>): Promise<APIResponse> {
    return this.http.put(`articles/${slug}`, { data: { article } });
  }

  async deleteArticleRaw(slug: string): Promise<APIResponse> {
    return this.http.delete(`articles/${slug}`);
  }

  async listArticles(query: { tag?: string; author?: string; limit?: number; offset?: number } = {}): Promise<ArticleList> {
    const params = Object.fromEntries(
      Object.entries({ limit: 10, offset: 0, ...query }).filter(([, v]) => v !== undefined),
    ) as Record<string, string | number>;
    const response = await withApiRetry(() => this.http.get('articles', { params }));
    return this.expectOk(response, 'list articles');
  }

  async tags(): Promise<string[]> {
    const response = await withApiRetry(() => this.http.get('tags'));
    return (await this.expectOk(response, 'get tags')).tags;
  }

  private async expectOk(response: APIResponse, action: string) {
    expect(response.ok(), `API "${action}" failed: ${response.status()} ${await response.text()}`).toBeTruthy();
    return response.json();
  }
}

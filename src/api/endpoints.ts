import type { Response } from '@playwright/test';

/**
 * Single source of truth for Conduit API routes, shared by the API client
 * (relative paths) and by page objects waiting on the app's own network calls.
 */
export const Endpoints = {
  users: 'users',
  login: 'users/login',
  currentUser: 'user',
  articles: 'articles',
  article: (slug: string) => `articles/${slug}`,
  tags: 'tags',
} as const;

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Route patterns matched against the pathname of requests the browser makes. */
const Routes = {
  login: /\/api\/users\/login$/,
  currentUser: /\/api\/user$/,
  // The UI creates with `POST /api/articles/` (trailing slash) and updates with `PUT /api/articles/:slug`.
  articles: /\/api\/articles\/?$/,
  article: /\/api\/articles\/[^/]+$/,
} as const;

function matches(response: Response, method: Method, route: RegExp, query: Record<string, string> = {}): boolean {
  if (response.request().method() !== method) return false;
  const url = new URL(response.url());
  if (!route.test(url.pathname)) return false;
  return Object.entries(query).every(([key, value]) => url.searchParams.get(key) === value);
}

/** Predicates for `page.waitForResponse(...)`. */
export const ApiResponse = {
  login: (r: Response) => matches(r, 'POST', Routes.login),
  updateUser: (r: Response) => matches(r, 'PUT', Routes.currentUser),
  createArticle: (r: Response) => matches(r, 'POST', Routes.articles),
  updateArticle: (r: Response) => matches(r, 'PUT', Routes.article),
  deleteArticle: (r: Response) => matches(r, 'DELETE', Routes.article),
  listArticles:
    (query: Record<string, string> = {}) =>
    (r: Response) =>
      matches(r, 'GET', Routes.articles, query),
};

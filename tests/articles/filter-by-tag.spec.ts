import { faker } from '@faker-js/faker';
import { test, expect } from '../../src/fixtures/test';
import type { ArticleList } from '../../src/api/types';

test.describe('Filter articles by tag', { tag: '@filter-by-tag' }, () => {
  test('shows only articles carrying the selected popular tag', { tag: '@positive' }, async ({ homePage, api }) => {
    // Random order, so each run can cover a different popular tag.
    const { tag, articles: expected } = await test.step('choose a random popular tag with articles', async () =>
      api.firstTagWithArticles(faker.helpers.shuffle(await api.tags())));

    await test.step('home page shows the global feed and the popular tag', async () => {
      await homePage.open();
      await homePage.expectActiveFeed('Global Feed');
      await expect(homePage.popularTag(tag)).toBeVisible();
    });

    const filtered = await test.step(`filter by "${tag}"`, async () => {
      const response = await homePage.filterByTag(tag);
      expect(response.ok()).toBeTruthy();
      return (await response.json()) as ArticleList;
    });

    await test.step('the tag becomes the only active feed', async () => {
      await homePage.expectActiveFeed(tag);
    });

    await test.step('listed articles match the API and all carry the tag', async () => {
      expect(filtered.articlesCount).toBe(expected.articlesCount);
      await expect(homePage.previewTitles()).toHaveText(filtered.articles.map((a) => a.title));
      for (const preview of await homePage.articlePreviews.all()) {
        await expect.soft(homePage.previewTags(preview).filter({ hasText: tag })).not.toHaveCount(0);
      }
    });

    await test.step('switching back to the global feed clears the filter', async () => {
      await homePage.globalFeedTab.click();
      await homePage.expectActiveFeed('Global Feed');
      await expect(homePage.feedTab(tag)).toBeHidden();
    });
  });

  test('shows an empty-state message when a tag has no articles', { tag: '@negative' }, async ({ page, homePage }) => {
    const tag = await test.step('pick a popular tag', async () => {
      await homePage.open();
      await expect(homePage.popularTags.first()).toBeVisible();
      return (await homePage.popularTags.first().innerText()).trim();
    });

    // Simulate the edge case the live data never produces: the filter returns nothing.
    await page.route(
      (url) => url.pathname.endsWith('/api/articles') && url.searchParams.get('tag') === tag,
      (route) => route.fulfill({ json: { articles: [], articlesCount: 0 } }),
    );

    await homePage.filterByTag(tag);

    await homePage.expectActiveFeed(tag);
    await expect(homePage.articlePreviews).toHaveCount(0);
    await expect(homePage.emptyFeedMessage).toBeVisible();
  });

  test('API returns no articles for an unknown tag', { tag: '@negative' }, async ({ api }) => {
    const unknownTag = `no-such-tag-${faker.string.alphanumeric(10)}`;
    const result = await api.listArticles({ tag: unknownTag });
    expect(result).toEqual({ articles: [], articlesCount: 0 });
    expect(await api.tags()).not.toContain(unknownTag);
  });
});

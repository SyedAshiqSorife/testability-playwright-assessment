import { test, expect } from '../../src/fixtures/test';

test.describe('Delete article', { tag: '@delete-article' }, () => {
  test('deletes an article and removes it everywhere', { tag: '@positive' }, async ({
    page, articlePage, profilePage, api, articles, sessionUser,
  }) => {
    const article = await test.step('pre-condition: create article via API', () => articles.create());

    await test.step('delete from the article page', async () => {
      await articlePage.open(article.slug);
      await expect(articlePage.title).toHaveText(article.title);
      const response = await articlePage.delete();
      expect(response.ok()).toBeTruthy();
    });

    await test.step('redirects to the home page', async () => {
      await expect(page).toHaveURL('/');
      await expect(articlePage.header.homeLink).toHaveClass(/active/);
    });

    await test.step('article no longer exists in the back end', async () => {
      const response = await api.getArticleRaw(article.slug);
      expect(response.status()).toBe(404);
    });

    await test.step("article is gone from the author's profile", async () => {
      const response = await profilePage.open(sessionUser.username);
      const titles = ((await response.json()).articles as { title: string }[]).map((a) => a.title);
      expect(titles).not.toContain(article.title);
      await expect(profilePage.articleTitles.filter({ hasText: article.title })).toHaveCount(0);
    });

    await test.step('its URL no longer shows the article', async () => {
      await page.goto(`/article/${article.slug}`);
      await expect(articlePage.title).toBeHidden();
    });
  });

  test("cannot delete another author's article", { tag: '@negative' }, async ({
    articlePage, api, otherUser, otherUserArticles,
  }) => {
    const foreign = await otherUserArticles.create();

    await test.step('UI offers no delete control to a non-author', async () => {
      await articlePage.open(foreign.slug);
      await expect(articlePage.authorLink).toHaveText(otherUser.username);
      await expect(articlePage.deleteButton).toHaveCount(0);
    });

    await test.step('API refuses the delete and the article survives', async () => {
      const response = await api.deleteArticleRaw(foreign.slug);
      expect(response.status()).toBe(403);
      expect(await response.json()).toMatchObject({ message: expect.stringMatching(/not authorized/i) });
      expect((await api.getArticleRaw(foreign.slug)).status()).toBe(200);
    });
  });

  test('deleting a non-existent article returns 404', { tag: '@negative' }, async ({ api }) => {
    const response = await api.deleteArticleRaw(`does-not-exist-${Date.now()}`);
    expect(response.status()).toBe(404);
  });
});

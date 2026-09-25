import { test, expect } from '../../src/fixtures/test';
import { buildArticle } from '../../src/data/factories';
import { invalidArticleCases } from '../../src/data/validation-cases';
import { signedOut } from '../../src/utils/session';

test.describe('Create article', { tag: '@create-article' }, () => {
  test(
    'publishes a new article and persists it',
    { tag: '@positive' },
    async ({ page, homePage, editorPage, articlePage, profilePage, api, articles, sessionUser }) => {
      const article = buildArticle();

      await test.step('open the editor from the header', async () => {
        await homePage.open();
        await homePage.header.newArticleLink.click();
        await expect(page).toHaveURL('/editor');
        await expect(editorPage.publishButton).toBeEnabled();
      });

      const slug = await test.step('fill in the form and publish', async () => {
        await editorPage.fill(article);
        await expect(editorPage.tagPills).toHaveCount(article.tagList.length);
        const response = await editorPage.publish();
        expect(response.status()).toBe(201);
        const created = (await response.json()).article;
        articles.track(created.slug);
        return created.slug as string;
      });

      await test.step('redirects to the new article page with the published content', async () => {
        await expect(page).toHaveURL(`/article/${slug}`);
        await articlePage.expectArticle(article, sessionUser.username);
        await expect(articlePage.editButton).toBeVisible();
        await expect(articlePage.deleteButton).toBeVisible();
        await expect(articlePage.errorMessages).toHaveCount(0);
      });

      await test.step('article is persisted in the back end', async () => {
        const saved = await api.getArticle(slug);
        expect(saved).toMatchObject({
          title: article.title,
          description: article.description,
          body: article.body,
          author: { username: sessionUser.username },
        });
        expect(saved.tagList.toSorted()).toEqual(article.tagList.toSorted());
      });

      await test.step('article is listed on the author profile', async () => {
        await profilePage.open(sessionUser.username);
        await expect(profilePage.articleTitle(article.title)).toHaveCount(1);
      });
    },
  );

  for (const { name, overrides, expectedError } of invalidArticleCases) {
    test(`rejects an article with ${name}`, { tag: '@negative' }, async ({ page, editorPage, api, sessionUser }) => {
      const article = buildArticle(overrides);
      await editorPage.openNew();
      await editorPage.fill(article);

      const response = await editorPage.publish();

      expect(response.status()).toBe(422);
      await expect(editorPage.errorMessages).toHaveText([expectedError]);
      await expect(page).toHaveURL('/editor');
      // Form input is preserved so the user can fix it.
      await expect(editorPage.descriptionInput).toHaveValue(article.description);
      const { articles } = await api.listArticles({ author: sessionUser.username, limit: 50 });
      expect(articles.map((a) => a.description)).not.toContain(article.description);
    });
  }

  test.describe('when signed out', () => {
    test.use({ storageState: signedOut });

    test('does not give access to the editor', { tag: '@negative' }, async ({ page, editorPage }) => {
      await editorPage.openNew();
      await expect(page).toHaveURL('/');
      await editorPage.header.expectSignedOut();
      await expect(editorPage.publishButton).toBeHidden();
    });
  });
});

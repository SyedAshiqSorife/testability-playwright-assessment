import { test, expect } from '../../src/fixtures/test';
import { buildArticle, buildTag } from '../../src/data/factories';

test.describe('Edit article', { tag: '@edit-article' }, () => {
  test('updates an existing article and persists the changes', { tag: '@positive' }, async ({
    page, articlePage, editorPage, api, articles, sessionUser,
  }) => {
    const original = await test.step('pre-condition: create article via API', () => articles.create());
    const changes = buildArticle();
    const addedTag = buildTag();
    const expectedTags = [...original.tagList, addedTag];

    await test.step('open the editor from the article page', async () => {
      await articlePage.open(original.slug);
      await articlePage.editButton.click();
      await expect(page).toHaveURL(`/editor/${original.slug}`);
    });

    await test.step('editor is pre-filled with the current content', async () => {
      await editorPage.expectPrefilledWith(original);
    });

    const slug = await test.step('change every field and publish', async () => {
      await editorPage.fill({ title: changes.title, description: changes.description, body: changes.body });
      await editorPage.addTags([addedTag]);
      const response = await editorPage.publish();
      expect(response.status()).toBe(200);
      const updated = (await response.json()).article;
      articles.track(updated.slug);
      return updated.slug as string;
    });

    await test.step('redirects to the article page showing the updated content', async () => {
      await expect(page).toHaveURL(`/article/${slug}`);
      await articlePage.expectArticle({ ...changes, tagList: expectedTags }, sessionUser.username);
      await expect(articlePage.title).not.toHaveText(original.title);
    });

    await test.step('changes are persisted and survive a reload', async () => {
      const saved = await api.getArticle(slug);
      expect(saved).toMatchObject({ title: changes.title, description: changes.description, body: changes.body });
      expect([...saved.tagList].sort()).toEqual([...expectedTags].sort());
      await page.reload();
      await expect(articlePage.title).toHaveText(changes.title);
    });
  });

  test('clearing the title does not wipe the saved title', { tag: '@negative' }, async ({
    page, editorPage, articlePage, api, articles,
  }) => {
    const original = await articles.create();
    await editorPage.openExisting(original.slug);
    await expect(editorPage.titleInput).toHaveValue(original.title);

    await editorPage.titleInput.clear();
    await editorPage.publish();

    await expect(page).toHaveURL(new RegExp(`/article/${original.slug}$`));
    await expect(articlePage.title).toHaveText(original.title);
    expect((await api.getArticle(original.slug)).title).toBe(original.title);
  });

  test("cannot edit another author's article", { tag: '@negative' }, async ({
    articlePage, api, otherUser, otherUserArticles,
  }) => {
    const foreign = await otherUserArticles.create();

    await test.step('UI offers no edit control to a non-author', async () => {
      await articlePage.open(foreign.slug);
      await expect(articlePage.authorLink).toHaveText(otherUser.username);
      await expect(articlePage.followButton).toBeVisible();
      await expect(articlePage.editButton).toHaveCount(0);
    });

    await test.step('API refuses the update and the article is unchanged', async () => {
      const response = await api.updateArticleRaw(foreign.slug, { title: 'hijacked title' });
      expect(response.status()).toBe(403);
      expect(await response.json()).toMatchObject({ message: expect.stringMatching(/not authorized/i) });
      expect((await api.getArticle(foreign.slug)).title).toBe(foreign.title);
    });
  });
});

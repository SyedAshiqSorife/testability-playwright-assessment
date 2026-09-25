import { isolatedUserTest as test, expect } from '../../src/fixtures/test';
import { buildUserSettings } from '../../src/data/factories';
import { ConduitApi } from '../../src/api/ConduitApi';
import { signedOut } from '../../src/utils/session';

test.describe('Update user settings', { tag: '@settings' }, () => {
  test(
    'updates the profile and credentials',
    { tag: '@positive' },
    async ({ page, homePage, settingsPage, profilePage, isolatedUser }) => {
      const settings = buildUserSettings();

      await test.step('open settings from the header', async () => {
        await homePage.open();
        await homePage.header.settingsLink.click();
        await expect(page).toHaveURL('/settings');
        await expect(settingsPage.heading).toBeVisible();
      });

      await test.step('submit new image, username, bio, email and password', async () => {
        await settingsPage.fill(settings);
        const response = await settingsPage.submit();
        expect(response.status()).toBe(200);
      });

      await test.step('redirects to the updated profile page', async () => {
        await expect(page).toHaveURL(`/profile/${settings.username}`);
        await profilePage.expectProfile(settings);
        await expect(profilePage.editSettingsLink).toBeVisible();
      });

      await test.step('session reflects the new username after reload', async () => {
        // Reload because of the known header defect covered by the `test.fail` test below.
        await profilePage.reload();
        await profilePage.header.expectSignedInAs(settings.username);
        await expect(profilePage.bio).toHaveText(settings.bio);
      });

      await test.step('changes are persisted in the back end', async () => {
        const user = await isolatedUser.api.currentUser();
        expect(user).toMatchObject({
          username: settings.username,
          email: settings.email,
          bio: settings.bio,
          image: settings.image,
        });
      });

      await test.step('new credentials work and old password no longer does', async () => {
        const anonymous = await ConduitApi.create();
        expect((await anonymous.login(settings.email, settings.password)).status()).toBe(200);
        expect((await anonymous.login(settings.email, isolatedUser.password)).ok()).toBeFalsy();
        await anonymous.dispose();
      });
    },
  );

  test(
    'header shows the new username right after saving',
    {
      tag: ['@positive', '@known-issue'],
      annotation: {
        type: 'issue',
        description:
          'After "Update Settings" the header nav renders empty (no user or sign-in links) until the page is reloaded.',
      },
    },
    async ({ page, settingsPage, profilePage }) => {
      // Expected to fail until the app is fixed; Playwright will flag it once it starts passing.
      test.fail();
      const { username } = buildUserSettings();
      await settingsPage.open();
      await settingsPage.fill({ username });
      await settingsPage.submit();
      await expect(page).toHaveURL(`/profile/${username}`);
      await profilePage.header.expectSignedInAs(username);
    },
  );

  test(
    'rejects a username that is already taken',
    { tag: '@negative' },
    async ({ page, settingsPage, otherUser, isolatedUser }) => {
      await settingsPage.open();
      await settingsPage.fill({ username: otherUser.username });

      const response = await settingsPage.submit();

      // The API currently answers 500 instead of 422 (see README "Defects"); assert only that it fails.
      expect(response.ok()).toBeFalsy();
      await expect(page).toHaveURL('/settings');
      await settingsPage.header.expectSignedInAs(isolatedUser.username);
      expect((await isolatedUser.api.currentUser()).username).toBe(isolatedUser.username);
    },
  );

  test.describe('when signed out', () => {
    test.use({ storageState: signedOut });

    test('does not give access to settings', { tag: '@negative' }, async ({ page, settingsPage }) => {
      await settingsPage.open();
      await expect(page).toHaveURL('/');
      await settingsPage.header.expectSignedOut();
      await expect(settingsPage.updateButton).toBeHidden();
    });
  });
});

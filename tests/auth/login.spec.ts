import { faker } from '@faker-js/faker';
import { test, expect } from '../../src/fixtures/test';
import { Messages } from '../../src/data/messages';
import { signedOut } from '../../src/utils/session';

test.describe('Sign in', { tag: '@auth' }, () => {
  test.use({ storageState: signedOut });

  test('rejects a wrong password', { tag: '@negative' }, async ({ page, loginPage, sessionUser }) => {
    await loginPage.open();

    const response = await loginPage.signIn(sessionUser.email, faker.internet.password({ length: 12 }));

    expect(response.ok()).toBeFalsy();
    await expect(loginPage.errorMessages).toHaveText([Messages.auth.invalidCredentials]);
    await expect(page).toHaveURL('/login');
    await loginPage.header.expectSignedOut();
  });
});

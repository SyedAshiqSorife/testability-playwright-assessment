import { test, expect } from '../../src/fixtures/test';
import { faker } from '@faker-js/faker';

test.describe('Sign in', { tag: '@auth' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('rejects a wrong password', { tag: '@negative' }, async ({ page, loginPage, sessionUser }) => {
    await loginPage.open();

    const response = await loginPage.signIn(sessionUser.email, faker.internet.password({ length: 12 }));

    expect(response.ok()).toBeFalsy();
    await expect(loginPage.errorMessages).toHaveText(['email or password is invalid']);
    await expect(page).toHaveURL('/login');
    await loginPage.header.expectSignedOut();
  });
});

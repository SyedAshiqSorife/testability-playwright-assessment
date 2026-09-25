import type { Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /sign in/i });
    this.emailInput = page.getByPlaceholder('Email');
    this.passwordInput = page.getByPlaceholder('Password');
    this.signInButton = page.getByRole('button', { name: /sign in/i });
  }

  async open(): Promise<void> {
    await this.visit('/login');
  }

  /** Submits the form and resolves with the login API response. */
  async signIn(email: string, password: string): Promise<Response> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().endsWith('/users/login') && r.request().method() === 'POST'),
      this.signInButton.click(),
    ]);
    return response;
  }
}

import type { Locator, Page, Response } from '@playwright/test';
import { ApiResponse } from '../api/endpoints';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    const form = page.locator('app-auth-page form');
    this.emailInput = form.getByPlaceholder('Email');
    this.passwordInput = form.getByPlaceholder('Password');
    this.signInButton = form.getByRole('button', { name: /sign in/i });
  }

  async open(): Promise<void> {
    await this.visit('/login');
  }

  /** Submits the form and resolves with the login API response. */
  async signIn(email: string, password: string): Promise<Response> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    const [response] = await Promise.all([this.page.waitForResponse(ApiResponse.login), this.signInButton.click()]);
    return response;
  }
}

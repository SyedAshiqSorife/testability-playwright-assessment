import type { Locator, Page, Response } from '@playwright/test';
import type { UserSettings } from '../api/types';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  readonly heading: Locator;
  readonly imageInput: Locator;
  readonly usernameInput: Locator;
  readonly bioInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly updateButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    const root = page.locator('app-settings-page');
    this.heading = root.getByRole('heading', { name: 'Your Settings' });
    this.imageInput = root.getByPlaceholder(/url of profile picture/i);
    this.usernameInput = root.getByPlaceholder('Username');
    this.bioInput = root.getByPlaceholder(/short bio/i);
    this.emailInput = root.getByPlaceholder('Email');
    this.passwordInput = root.getByPlaceholder(/new password/i);
    this.updateButton = root.getByRole('button', { name: /update settings/i });
    this.logoutButton = root.getByRole('button', { name: /logout/i });
  }

  async open(): Promise<void> {
    await this.visit('/settings');
  }

  async fill(settings: UserSettings): Promise<void> {
    if (settings.image !== undefined) await this.imageInput.fill(settings.image);
    if (settings.username !== undefined) await this.usernameInput.fill(settings.username);
    if (settings.bio !== undefined) await this.bioInput.fill(settings.bio);
    if (settings.email !== undefined) await this.emailInput.fill(settings.email);
    if (settings.password !== undefined) await this.passwordInput.fill(settings.password);
  }

  /** Submits the form and resolves with the `PUT /user` API response. */
  async submit(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().endsWith('/api/user') && r.request().method() === 'PUT'),
      this.updateButton.click(),
    ]);
    return response;
  }
}

import type { Locator, Page } from '@playwright/test';
import { Header } from './components/Header';

export abstract class BasePage {
  readonly header: Header;
  /** Server-side validation errors rendered by `<app-list-errors>`. */
  readonly errorMessages: Locator;

  protected constructor(readonly page: Page) {
    this.header = new Header(page);
    this.errorMessages = page.locator('app-list-errors .error-messages li');
  }

  protected async visit(path: string): Promise<void> {
    await this.page.goto(path);
  }
}

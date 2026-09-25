import type { Locator, Page } from '@playwright/test';
import { Header } from './components/Header';

/**
 * Locator strategy (in order of preference):
 *  1. User-facing attributes: role + accessible name, placeholder, visible text.
 *  2. Scoping to the Angular component that owns the element (`app-editor-page`, …),
 *     so identical controls elsewhere on the page never match.
 *  3. Structural CSS classes, only where the app exposes nothing semantic. The app
 *     ships no `data-testid`s; `testIdAttribute` is configured for when it does.
 * Dynamic locators (depending on test data) are methods, e.g. `tagPill(tag)`.
 */
export abstract class BasePage {
  readonly header: Header;
  /** Server-side validation errors rendered by `<app-list-errors>`. */
  readonly errorMessages: Locator;

  protected constructor(readonly page: Page) {
    this.header = new Header(page);
    this.errorMessages = page.locator('app-list-errors').getByRole('listitem');
  }

  protected async visit(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** Reloads the current page, e.g. to prove data survives a fresh load. */
  async reload(): Promise<void> {
    await this.page.reload();
  }
}

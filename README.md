# Conduit E2E: Playwright + TypeScript

End-to-end test framework for [Conduit](https://conduit.bondaracademy.com/), a RealWorld blogging app. It covers creating, editing, deleting and tag-filtering articles and updating user settings. Every scenario has positive and negative tests, and the suite runs on Chromium, Firefox and WebKit.

## Quick start

```bash
npm ci
npx playwright install        # add --with-deps on a fresh Linux box
npm test                      # all browsers, in parallel
```

You don't need credentials. Each run registers a new throwaway user with random details.

| Command | What it does |
| --- | --- |
| `npm test` | Full suite on Chromium, Firefox and WebKit |
| `npm run test:chromium` / `:firefox` / `:webkit` | One browser |
| `npm run test:positive` / `test:negative` | Filter by tag |
| `npx playwright test --grep @edit-article` | One scenario |
| `npm run test:headed` / `npm run test:ui` | Watch the run or debug it |
| `npm run report` | Open the Playwright HTML report |
| `npm run allure:generate && npm run allure:open` | Allure report (needs Java) |
| `npm run typecheck` | Run the TypeScript compiler |

Optional `.env` settings (see `.env.example`): `BASE_URL`, `API_URL`. Set `FAKER_SEED=<n>` to get the same random test data again when reproducing a failure.

## Project layout

```
src/
  api/          ConduitApi (typed REST client) and API types
  config/       environment settings (base and API URLs)
  data/         Faker-based factories for articles, users and settings
  fixtures/     custom Playwright fixtures and ArticleFactory (auto-cleanup)
  pages/        page objects and the shared Header component
  utils/        session/storage-state helpers, API retry, text matchers
tests/
  auth.setup.ts                  runs once: registers a user, logs in via the UI, saves the session
  articles/  create | edit | delete | filter-by-tag specs
  settings/  update-settings spec
  auth/      login negative spec
.github/workflows/playwright.yml CI pipeline
```

## Coverage

| Scenario | Positive | Negative / edge cases |
| --- | --- | --- |
| **Create article** | Publish from the editor. Checks the redirect to `/article/:slug`, the rendered title, author, tags and markdown, the Edit/Delete controls, the API record and the author's profile list. | Missing title and missing body both return 422, show the inline message and keep the user's input. A signed-out user can't reach the editor. |
| **Edit article** (created via API) | The editor is pre-filled. Every field changes and a tag is added. Checks the redirect, the updated page, the API record and that changes survive a reload. | Clearing the title doesn't wipe the saved title. A non-author sees no Edit control, and the API returns 403 with the article unchanged. |
| **Delete article** (created via API) | Checks the redirect to home, that the API returns 404 afterwards, that the article is gone from the author's profile and that its URL no longer shows it. | A non-author sees no Delete control, and the API returns 403 with the article kept. Deleting an article that doesn't exist returns 404. |
| **Filter by tag** | Picks a random popular tag that has articles and shows its tab as active. The listed titles must match the API exactly and every preview must carry the tag. Switching back to Global Feed clears the filter. | Empty result: the network response is mocked and the "No articles are here… yet." message must appear. The API returns nothing for an unknown tag. |
| **Update settings** | Changes image, username, bio, email and password. Checks the redirect to the new profile, the rendered values, the API record, that the new password works and that the old one is rejected. | A taken username is rejected and nothing changes. A signed-out user can't reach settings. |
| **Sign in** | Covered by `auth.setup.ts` | A wrong password shows "email or password is invalid". |

Test tags: `@positive`, `@negative`, `@known-issue`, plus one tag per scenario (`@create-article`, `@edit-article`, `@delete-article`, `@filter-by-tag`, `@settings`, `@auth`).

## Design decisions

**Session reuse.** The `setup` project runs once per invocation, before all three browser projects. It signs in through the real login form and saves `storageState` to `.auth/user.json`. The app stores its JWT in `localStorage`, so the saved state holds it. All tests start already signed in, and the API client reads the same token, so there are no repeated logins. Settings tests change the account itself, so `isolatedUserTest` gives each of them its own user. That user is registered through the API and signed in by injecting its token, which skips the UI and avoids affecting parallel tests. `.auth/` is gitignored.

**API for setup, UI for behaviour.** Articles needed as pre-conditions are created through `ConduitApi`. The UI steps under test then run through page objects, and the result is checked again through the API to confirm persistence. `ArticleFactory` deletes everything a test created, including articles created through the UI, so the shared demo backend stays clean.

**Assertions tied to network responses.** Actions such as `publish()`, `delete()`, `submit()` and `filterByTag()` wait for their API response and return it. Tests can then assert on status codes and payloads, and they wait on real events rather than fixed sleeps. The suite has no `waitForTimeout` calls.

**Locators that survive UI changes.** Locators use roles, placeholders and visible text first (`getByRole`, `getByPlaceholder`) and are scoped to Angular component roots such as `app-editor-page`. They fall back to structural classes only where the app has nothing semantic, because it has no `data-testid` attributes. If test ids are added later, `testIdAttribute` is already configured.

**Flakiness controls.** Web-first `expect` assertions retry automatically. `withApiRetry` retries only network errors, 5xx and 429 responses. 4xx responses are real answers that negative tests need to see. Playwright retries tests once locally and twice in CI.

**Dynamic data.** Titles, bodies, tags, usernames, emails, passwords, bios and avatars come from Faker with a unique suffix, so parallel workers and repeated runs never collide. Article bodies are markdown so the tests can check that they render.

## Reports and traceability

- **HTML report**: `reports/html`, with steps, screenshots, video and a trace for each failure.
- **Allure**: `reports/allure-results` becomes `reports/allure-report`.
- **JUnit XML**: `reports/junit/results.xml`, for CI dashboards.
- **On failure**: trace (`retain-on-failure`), screenshot and video. Open a trace with `npx playwright show-trace <trace.zip>`.

## CI/CD (GitHub Actions)

`.github/workflows/playwright.yml` runs on pushes to main, pull requests, every night and on manual dispatch. Manual runs accept an optional `--grep` filter.

- A matrix runs one parallel job per browser: type-check, install that browser, then run its tests.
- Each job uploads its HTML report and Allure results. On failure it also uploads `test-results/` (traces, screenshots, videos) and adds JUnit annotations to the run.
- An `allure-report` job merges the results from all browsers into one Allure report artifact.

## Defects found in the application

1. **Header goes blank after saving settings.** After "Update Settings" the nav shows neither the signed-in links nor Sign in/Sign up until the page is reloaded. This is tracked as a `test.fail()` test (`@known-issue`), so the suite stays green and Playwright flags the test once the bug is fixed.
2. **Taken username or email causes a server error.** `PUT /user` returns **500** with a raw Prisma "unique constraint" message instead of a 422 validation error, and the UI shows the user nothing.
3. **Blank fields are ignored without a message.** A blank title on edit, or a blank email in settings, is dropped and the old value is kept, with no error shown. The tests record this current behaviour.
4. **Stale feed request.** Clicking a tag before the global feed finishes loading can let the late global response overwrite the filtered list. `HomePage.open()` waits for the initial feed to avoid this.
5. **Settings form isn't pre-filled** with the current user's values.


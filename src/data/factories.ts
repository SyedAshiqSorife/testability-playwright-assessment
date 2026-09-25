import { faker } from '@faker-js/faker';
import type { ArticleInput, NewUser, UserSettings } from '../api/types';

/**
 * Randomized test data. Every value carries a short unique suffix so parallel
 * workers and repeated runs against the shared demo backend never collide.
 * Set FAKER_SEED to reproduce a specific run's data.
 */
if (process.env.FAKER_SEED) faker.seed(Number(process.env.FAKER_SEED));

export const uniqueId = (): string => `${Date.now().toString(36)}${faker.string.alphanumeric(4).toLowerCase()}`;

const cap = (text: string, max: number) => text.slice(0, max).trim();

export function buildTag(): string {
  return `${faker.word.noun().toLowerCase().replace(/[^a-z]/g, '')}-${faker.string.alphanumeric(5).toLowerCase()}`;
}

export function buildArticle(overrides: Partial<ArticleInput> = {}): ArticleInput {
  const heading = faker.lorem.words(3);
  const bullet = faker.hacker.noun();
  return {
    title: `${cap(faker.hacker.phrase().replace(/[^\w\s'-]/g, ''), 60)} ${uniqueId()}`,
    description: cap(faker.lorem.sentence({ min: 5, max: 12 }), 120),
    // Markdown on purpose: lets tests verify the article body is rendered, not echoed.
    body: `## ${heading}\n\n${faker.lorem.paragraph()}\n\n- **${bullet}**\n`,
    tagList: faker.helpers.multiple(buildTag, { count: { min: 1, max: 3 } }),
    ...overrides,
  };
}

/** The API rejects usernames longer than this. */
const MAX_USERNAME_LENGTH = 20;

export function buildUser(): NewUser {
  const id = uniqueId();
  const first = faker.person.firstName().toLowerCase().replace(/[^a-z]/g, '');
  return {
    // Truncate the name, never the unique suffix.
    username: `${first.slice(0, MAX_USERNAME_LENGTH - id.length)}${id}`,
    email: `qa.${first}.${id}@example.test`,
    password: faker.internet.password({ length: 14, prefix: 'Aa1!' }),
  };
}

export function buildUserSettings(): Required<UserSettings> {
  const user = buildUser();
  return {
    image: faker.image.avatarGitHub(),
    username: user.username,
    bio: cap(faker.person.bio(), 200),
    email: user.email,
    password: user.password,
  };
}

import type { ArticleInput } from '../api/types';
import { Messages } from './messages';

export interface InvalidArticleCase {
  name: string;
  /** Applied on top of an otherwise valid, randomly generated article. */
  overrides: Partial<ArticleInput>;
  expectedError: string;
}

/** Data-driven negative cases for the article editor; add a row to add a test. */
export const invalidArticleCases: InvalidArticleCase[] = [
  { name: 'missing title', overrides: { title: '' }, expectedError: Messages.validation.titleBlank },
  { name: 'missing body', overrides: { body: '' }, expectedError: Messages.validation.bodyBlank },
];

import type { APIResponse } from '@playwright/test';

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries an API call on network errors and 5xx/429 responses. 4xx responses are
 * returned as-is: they are real answers that negative tests need to assert on.
 */
export async function withApiRetry(
  call: () => Promise<APIResponse>,
  { attempts = 3, delayMs = 1_000 }: RetryOptions = {},
): Promise<APIResponse> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await call();
      const transient = response.status() >= 500 || response.status() === 429;
      if (!transient || attempt === attempts) return response;
      lastError = new Error(`HTTP ${response.status()} from ${response.url()}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
    await sleep(delayMs * attempt);
  }
  throw lastError;
}

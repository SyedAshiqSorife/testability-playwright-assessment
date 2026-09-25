import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';
import type { SessionUser } from '../api/types';

const AUTH_DIR = path.resolve(__dirname, '../../.auth');

/** Playwright storage state (localStorage JWT) produced by `auth.setup.ts`. */
export const STORAGE_STATE = path.join(AUTH_DIR, 'user.json');
/** Non-secret profile of the session user (username/email) for assertions. */
const SESSION_USER = path.join(AUTH_DIR, 'user.meta.json');

/** The Angular app keeps its session in localStorage under this key. */
export const JWT_STORAGE_KEY = 'jwtToken';

type StorageState = {
  cookies: [];
  origins: { origin: string; localStorage: { name: string; value: string }[] }[];
};

/** Builds an in-memory storage state so a context starts already signed in as `token`'s owner. */
export function storageStateFor(token: string): StorageState {
  return {
    cookies: [],
    origins: [{ origin: env.baseUrl, localStorage: [{ name: JWT_STORAGE_KEY, value: token }] }],
  };
}

export function saveSessionUser(user: SessionUser): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(SESSION_USER, JSON.stringify(user, null, 2));
}

export function readSessionUser(): SessionUser {
  const user = JSON.parse(fs.readFileSync(SESSION_USER, 'utf-8')) as SessionUser;
  const state = JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf-8')) as StorageState;
  const token = state.origins
    .flatMap((o) => o.localStorage)
    .find((item) => item.name === JWT_STORAGE_KEY)?.value;
  if (!token) throw new Error(`No ${JWT_STORAGE_KEY} in ${STORAGE_STATE}; did the setup project run?`);
  return { ...user, token };
}

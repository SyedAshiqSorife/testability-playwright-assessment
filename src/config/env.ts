import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const trimSlash = (url: string) => url.replace(/\/+$/, '');

export const env = {
  baseUrl: trimSlash(process.env.BASE_URL ?? 'https://conduit.bondaracademy.com'),
  apiUrl: trimSlash(process.env.API_URL ?? 'https://conduit-api.bondaracademy.com/api'),
} as const;

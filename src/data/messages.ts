/** User-facing and API messages the application is expected to produce. */
export const Messages = {
  validation: {
    titleBlank: "title can't be blank",
    bodyBlank: "body can't be blank",
  },
  auth: {
    invalidCredentials: 'email or password is invalid',
  },
  permissions: {
    notAuthorized: /not authorized/i,
  },
  feed: {
    empty: /no articles are here/i,
  },
} as const;

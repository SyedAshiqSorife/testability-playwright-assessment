export interface ArticleInput {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

export interface Article extends ArticleInput {
  slug: string;
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
}

export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
}

export interface User {
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
  token: string;
}

export interface UserSettings {
  image?: string;
  username?: string;
  bio?: string;
  email?: string;
  password?: string;
}

/** A signed-in user as the tests see it. */
export interface SessionUser {
  username: string;
  email: string;
  token?: string;
}

export interface ArticleList {
  articles: Article[];
  articlesCount: number;
}

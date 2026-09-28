export type Role = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  _id: string;
  name: string;
  email?: string;
  interests?: string[];
}

export interface Note {
  _id: string;
  owner: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNote extends Omit<Note, 'owner'> {
  owner: UserSummary | null;
}

export interface Post {
  _id: string;
  author: UserSummary | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterestGroup {
  interest: string;
  count: number;
  users: UserSummary[];
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserPostsPage extends Page<Omit<Post, 'author'>> {
  author: UserSummary;
}

export interface AuthSession {
  token: string;
  user: User;
}

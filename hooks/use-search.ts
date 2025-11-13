import useSWR from 'swr';

import type { PostSearchResult, UserSearchResult } from '@/types/search';

interface PostsResponse {
  posts: PostSearchResult[];
}

interface UsersResponse {
  users: UserSearchResult[];
}

function extractMessage(source: unknown, fallback: string): string {
  if (!source) {
    return fallback;
  }

  if (typeof source === 'string') {
    return source;
  }

  if (Array.isArray(source)) {
    return source
      .map((item) => (typeof item === 'string' ? item : ''))
      .filter(Boolean)
      .join(' ');
  }

  if (typeof source === 'object') {
    const message = (source as { message?: unknown }).message;
    return extractMessage(message, fallback);
  }

  return fallback;
}

function isPostsResponse(data: unknown): data is PostsResponse {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray((data as { posts?: unknown }).posts)
  );
}

async function fetchSearchPosts(url: string): Promise<PostSearchResult[]> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (response.status === 401) {
    const message = extractMessage(
      data,
      'Sessão expirada. Faça login novamente.',
    );
    const error = new Error(message);
    error.name = 'UnauthorizedError';
    throw error;
  }

  if (!response.ok) {
    throw new Error(
      extractMessage(data, 'Não foi possível realizar a busca de posts.'),
    );
  }

  if (isPostsResponse(data)) {
    return data.posts;
  }

  return [];
}

export function useSearchPosts(query: string) {
  const trimmedQuery = query.trim();
  const searchKey = trimmedQuery
    ? `/api/search/posts?search=${encodeURIComponent(trimmedQuery)}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<PostSearchResult[]>(
    searchKey,
    fetchSearchPosts,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    posts: data ?? [],
    isLoading,
    error,
    mutate,
    hasQuery: Boolean(trimmedQuery),
  };
}

function isUsersResponse(data: unknown): data is UsersResponse {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray((data as { users?: unknown }).users)
  );
}

async function fetchSearchUsers(url: string): Promise<UserSearchResult[]> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (response.status === 401) {
    const message = extractMessage(
      data,
      'Sessão expirada. Faça login novamente.',
    );
    const error = new Error(message);
    error.name = 'UnauthorizedError';
    throw error;
  }

  if (!response.ok) {
    throw new Error(
      extractMessage(data, 'Não foi possível realizar a busca de usuários.'),
    );
  }

  if (isUsersResponse(data)) {
    return data.users;
  }

  return [];
}

export function useSearchUsers(query: string) {
  const trimmedQuery = query.trim();
  const searchKey = trimmedQuery
    ? `/api/search/users?search=${encodeURIComponent(trimmedQuery)}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<UserSearchResult[]>(
    searchKey,
    fetchSearchUsers,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    users: data ?? [],
    isLoading,
    error,
    mutate,
    hasQuery: Boolean(trimmedQuery),
  };
}

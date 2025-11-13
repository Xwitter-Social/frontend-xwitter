import useSWR from 'swr';

import type { RelationshipUser, UserProfilePayload } from '@/types/profile';
import type { RepostTimelinePost, TimelinePost } from '@/types/post';

function extractMessage(source: unknown, fallback: string): string {
  if (!source) {
    return fallback;
  }

  if (typeof source === 'string') {
    return source;
  }

  if (Array.isArray(source)) {
    const joined = source
      .map((item) => (typeof item === 'string' ? item : ''))
      .filter(Boolean)
      .join(' ');

    return joined || fallback;
  }

  if (typeof source === 'object') {
    const message = (source as { message?: unknown }).message;
    if (message === undefined) {
      return fallback;
    }

    return extractMessage(message, fallback);
  }

  return fallback;
}

function isUserProfilePayload(data: unknown): data is UserProfilePayload {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const payload = data as Record<string, unknown>;
  return (
    typeof payload.profile === 'object' &&
    typeof payload.stats === 'object' &&
    typeof payload.viewerRelationship === 'object'
  );
}

function isRelationshipsResponse(
  data: unknown,
): data is { users: RelationshipUser[] } {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray((data as { users?: unknown }).users)
  );
}

function isPostsResponse(data: unknown): data is { posts: TimelinePost[] } {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray((data as { posts?: unknown }).posts)
  );
}

function isRepostsResponse(
  data: unknown,
): data is { reposts: RepostTimelinePost[] } {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray((data as { reposts?: unknown }).reposts)
  );
}

async function fetchProfile(url: string): Promise<UserProfilePayload> {
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
    const message = extractMessage(data, 'Não foi possível carregar o perfil.');
    throw new Error(message);
  }

  if (!isUserProfilePayload(data)) {
    throw new Error('Resposta inválida ao carregar o perfil.');
  }

  return data;
}

export function useProfile(identifier: string | null | undefined) {
  const swrKey = identifier ? `/api/users/${identifier}/profile` : null;

  const { data, error, isLoading, mutate } = useSWR<UserProfilePayload>(
    swrKey,
    fetchProfile,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    profile: data ?? null,
    isLoading,
    error,
    mutate,
  };
}

async function fetchRelationships(url: string): Promise<RelationshipUser[]> {
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
    const message = extractMessage(
      data,
      'Não foi possível carregar a lista de usuários.',
    );
    throw new Error(message);
  }

  if (isRelationshipsResponse(data)) {
    return data.users;
  }

  return [];
}

export function useProfileFollowers(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const swrKey = userId && enabled ? `/api/users/${userId}/followers` : null;

  const { data, error, isLoading, mutate } = useSWR<RelationshipUser[]>(
    swrKey,
    fetchRelationships,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    followers: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useProfileFollowing(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const swrKey = userId && enabled ? `/api/users/${userId}/following` : null;

  const { data, error, isLoading, mutate } = useSWR<RelationshipUser[]>(
    swrKey,
    fetchRelationships,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    following: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

async function fetchPosts(url: string): Promise<TimelinePost[]> {
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
    const message = extractMessage(
      data,
      'Não foi possível carregar os posts do usuário.',
    );
    throw new Error(message);
  }

  if (isPostsResponse(data)) {
    return data.posts;
  }

  return [];
}

export function useProfilePosts(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const swrKey = userId && enabled ? `/api/users/${userId}/posts` : null;

  const { data, error, isLoading, mutate } = useSWR<TimelinePost[]>(
    swrKey,
    fetchPosts,
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
  };
}

async function fetchReposts(url: string): Promise<RepostTimelinePost[]> {
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
    const message = extractMessage(
      data,
      'Não foi possível carregar os reposts do usuário.',
    );
    throw new Error(message);
  }

  if (isRepostsResponse(data)) {
    return data.reposts;
  }

  return [];
}

export function useProfileReposts(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const swrKey = userId && enabled ? `/api/users/${userId}/reposts` : null;

  const { data, error, isLoading, mutate } = useSWR<RepostTimelinePost[]>(
    swrKey,
    fetchReposts,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    reposts: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

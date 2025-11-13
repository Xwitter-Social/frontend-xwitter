import useSWR from 'swr';

import type { TimelinePost } from '@/types/post';

interface TimelineResponse {
  posts: TimelinePost[];
}

async function fetchTimeline(url: string): Promise<TimelinePost[]> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as
    | TimelineResponse
    | { message?: string }
    | null;

  if (response.status === 401) {
    const message =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : 'Sessão expirada. Faça login novamente.';
    const error = new Error(message);
    error.name = 'UnauthorizedError';
    throw error;
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : 'Não foi possível carregar a timeline.';
    throw new Error(message);
  }

  if (data && typeof data === 'object' && 'posts' in data) {
    return Array.isArray(data.posts) ? data.posts : [];
  }

  return [];
}

export function useTimeline() {
  const { data, error, isLoading, mutate } = useSWR<TimelinePost[]>(
    '/api/timeline',
    fetchTimeline,
    {
      revalidateOnFocus: true,
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

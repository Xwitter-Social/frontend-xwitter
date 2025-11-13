import useSWR from 'swr';

import type { User } from '@/types/user';

interface ApiSuccessResponse {
  user: User;
}

interface UseCurrentUserOptions {
  enabled?: boolean;
}

async function fetchCurrentUser(url: string): Promise<User | null> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as
    | ApiSuccessResponse
    | { message?: string }
    | null;

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : 'Não foi possível carregar o usuário autenticado.';
    throw new Error(message);
  }

  if (data && typeof data === 'object' && 'user' in data) {
    return (data as ApiSuccessResponse).user;
  }

  return null;
}

export function useCurrentUser(options: UseCurrentUserOptions = {}) {
  const { enabled = true } = options;

  const swrKey = enabled ? '/api/auth/me' : null;

  const { data, error, isLoading, mutate } = useSWR<User | null>(
    swrKey,
    fetchCurrentUser,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    user: data ?? null,
    isLoading,
    error,
    mutate,
  };
}

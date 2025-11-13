import useSWR from 'swr';

import type { PostDetails } from '@/types/post';

interface PostDetailsResponse {
  post: PostDetails;
}

async function fetchPostDetails(url: string): Promise<PostDetails> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as
    | PostDetailsResponse
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
        : 'Não foi possível carregar os detalhes do post.';
    throw new Error(message);
  }

  if (!data || typeof data !== 'object' || !('post' in data)) {
    throw new Error('Resposta inválida ao carregar os detalhes do post.');
  }

  return data.post;
}

export function usePostDetails(postId?: string) {
  const shouldFetch = Boolean(postId);
  const { data, error, isLoading, mutate } = useSWR<PostDetails>(
    shouldFetch ? `/api/posts/${postId}` : null,
    fetchPostDetails,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    post: data,
    error,
    isLoading,
    mutate,
  };
}

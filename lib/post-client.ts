import type { CommentNode, PostDetails } from '@/types/post';

interface ApiResponse {
  message?: unknown;
  post?: unknown;
  comment?: unknown;
  repost?: unknown;
}

interface RepostPayload {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

async function readResponseBody(
  response: Response,
): Promise<ApiResponse | null> {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      return (await response.json()) as ApiResponse;
    } catch (error) {
      console.error('Não foi possível analisar o corpo da resposta.', error);
      return null;
    }
  }

  return null;
}

function extractMessage(body: ApiResponse | null, fallback: string): string {
  if (!body) {
    return fallback;
  }

  if (typeof body.message === 'string') {
    return body.message;
  }

  if (Array.isArray(body.message)) {
    return body.message.join(' ');
  }

  return fallback;
}

export async function likePost(postId: string): Promise<string> {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(extractMessage(body, 'Não foi possível curtir o post.'));
  }

  return extractMessage(body, 'Post curtido com sucesso.');
}

export async function unlikePost(postId: string): Promise<string> {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      extractMessage(body, 'Não foi possível remover a curtida do post.'),
    );
  }

  return extractMessage(body, 'Curtida removida com sucesso.');
}

export async function repostPost(postId: string): Promise<RepostPayload> {
  const response = await fetch(`/api/posts/${postId}/repost`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      extractMessage(body, 'Não foi possível repostar este conteúdo.'),
    );
  }

  if (!body?.repost || typeof body.repost !== 'object') {
    throw new Error('Resposta inválida ao criar o repost.');
  }

  return body.repost as RepostPayload;
}

export async function deleteRepost(repostId: string): Promise<string> {
  const response = await fetch(`/api/reposts/${repostId}`, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      extractMessage(body, 'Não foi possível desfazer o repost.'),
    );
  }

  return extractMessage(body, 'Repost removido com sucesso.');
}

export async function deletePost(postId: string): Promise<string> {
  const response = await fetch(`/api/posts/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(extractMessage(body, 'Não foi possível excluir o post.'));
  }

  return extractMessage(body, 'Post excluído com sucesso.');
}

export interface CreateCommentPayload {
  content: string;
  parentCommentId?: string;
}

export async function createComment(
  postId: string,
  payload: CreateCommentPayload,
): Promise<CommentNode> {
  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      extractMessage(body, 'Não foi possível publicar o comentário.'),
    );
  }

  if (!body?.comment || typeof body.comment !== 'object') {
    throw new Error('Resposta inválida ao criar o comentário.');
  }

  return body.comment as CommentNode;
}

export async function deleteComment(commentId: string): Promise<string> {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      extractMessage(body, 'Não foi possível excluir o comentário.'),
    );
  }

  return extractMessage(body, 'Comentário excluído com sucesso.');
}

export async function getPostDetails(postId: string): Promise<PostDetails> {
  const response = await fetch(`/api/posts/${postId}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      extractMessage(body, 'Não foi possível carregar os detalhes do post.'),
    );
  }

  if (!body?.post || typeof body.post !== 'object') {
    throw new Error('Resposta inválida ao carregar os detalhes do post.');
  }

  return body.post as PostDetails;
}

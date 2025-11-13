import type { User } from '@/types/user';

interface UpdateAccountPayload {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  bio?: string | null;
  password?: string;
}

interface ApiResponseBody {
  message?: unknown;
  user?: unknown;
}

function extractMessage(
  body: ApiResponseBody | null,
  fallback: string,
): string {
  if (!body) {
    return fallback;
  }

  const { message } = body;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return fallback;
}

function parseUser(body: ApiResponseBody | null): User | null {
  const possibleUser = body?.user;

  if (possibleUser && typeof possibleUser === 'object') {
    return possibleUser as User;
  }

  return null;
}

export async function updateAccount(payload: UpdateAccountPayload): Promise<{
  user: User;
  message: string;
}> {
  const response = await fetch('/api/account', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  const body = (await response
    .json()
    .catch(() => null)) as ApiResponseBody | null;
  const message = extractMessage(body, 'Perfil atualizado com sucesso.');

  if (!response.ok) {
    throw new Error(message);
  }

  const updatedUser = parseUser(body);

  if (!updatedUser) {
    throw new Error('Resposta inválida do servidor ao atualizar o perfil.');
  }

  return { user: updatedUser, message };
}

export async function deleteAccount(userId: string): Promise<string> {
  const response = await fetch('/api/account', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ id: userId }),
  });

  const body = (await response
    .json()
    .catch(() => null)) as ApiResponseBody | null;
  const message = extractMessage(body, 'Conta excluída com sucesso.');

  if (!response.ok) {
    throw new Error(message);
  }

  return message;
}

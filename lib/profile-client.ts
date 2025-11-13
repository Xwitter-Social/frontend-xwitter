interface ApiResponseBody {
  message?: unknown;
}

async function readResponseBody(
  response: Response,
): Promise<ApiResponseBody | null> {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      return (await response.json()) as ApiResponseBody;
    } catch (error) {
      console.error('Não foi possível analisar o corpo da resposta.', error);
      return null;
    }
  }

  return null;
}

function extractMessage(
  body: ApiResponseBody | null,
  fallback: string,
): string {
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

export async function followUser(userIdentifier: string): Promise<string> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(userIdentifier)}/follow`,
    {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    },
  );

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      extractMessage(body, 'Não foi possível seguir este usuário.'),
    );
  }

  return extractMessage(body, 'Usuário seguido com sucesso.');
}

export async function unfollowUser(userIdentifier: string): Promise<string> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(userIdentifier)}/follow`,
    {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
    },
  );

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      extractMessage(body, 'Não foi possível deixar de seguir este usuário.'),
    );
  }

  return extractMessage(body, 'Você deixou de seguir este usuário.');
}

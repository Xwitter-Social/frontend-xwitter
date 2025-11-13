import { NextResponse } from 'next/server';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../../_lib/backend';

function extractQuery(request: Request): string {
  try {
    const url = new URL(request.url);
    return url.searchParams.get('search')?.trim() ?? '';
  } catch {
    return '';
  }
}

export async function GET(request: Request) {
  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const query = extractQuery(request);

  if (!query) {
    return NextResponse.json({ posts: [] }, { status: 200 });
  }

  const backendUrl = new URL(`${getBackendUrl()}/post/search`);
  backendUrl.searchParams.set('search', query);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão com o servidor de posts.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(
      responseBody,
      'Não foi possível realizar a busca de posts.',
    );

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const posts = Array.isArray(responseBody) ? responseBody : [];

  return NextResponse.json({ posts }, { status: 200 });
}

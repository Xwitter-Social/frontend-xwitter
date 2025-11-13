import { NextResponse } from 'next/server';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../../../_lib/backend';

interface RouteContext {
  params: Promise<{
    identifier?: string;
  }>;
}

interface BackendUser {
  id: string;
}

export async function GET(_request: Request, context: RouteContext) {
  const { identifier } = await context.params;

  if (!identifier) {
    return NextResponse.json(
      { message: 'Identificador do usuário não informado.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const backendUrl = getBackendUrl();
  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const targetUserUrl = `${backendUrl}/user/${encodeURIComponent(identifier)}`;
  let targetUserResponse: Response;

  try {
    targetUserResponse = await fetch(targetUserUrl, {
      headers: authHeaders,
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao carregar o usuário solicitado.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const targetUserBody = await targetUserResponse.json().catch(() => null);

  if (targetUserResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(
        targetUserBody,
        'Sessão expirada. Faça login novamente.',
      ),
    );
  }

  if (!targetUserResponse.ok) {
    const message = resolveErrorMessage(
      targetUserBody,
      'Não foi possível carregar o usuário solicitado.',
    );

    return NextResponse.json(
      { message },
      { status: targetUserResponse.status },
    );
  }

  const targetUser = targetUserBody as BackendUser;

  const postsUrl = `${backendUrl}/post/user/${encodeURIComponent(targetUser.id)}`;
  let postsResponse: Response;

  try {
    postsResponse = await fetch(postsUrl, {
      headers: authHeaders,
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao carregar posts do usuário.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const postsBody = await postsResponse.json().catch(() => null);

  if (postsResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(postsBody, 'Sessão expirada. Faça login novamente.'),
    );
  }

  if (!postsResponse.ok) {
    const message = resolveErrorMessage(
      postsBody,
      'Não foi possível carregar os posts do usuário.',
    );

    return NextResponse.json({ message }, { status: postsResponse.status });
  }

  const posts = Array.isArray(postsBody) ? postsBody : [];

  return NextResponse.json({ posts }, { status: 200 });
}

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

  const repostsUrl = `${backendUrl}/post/user/${encodeURIComponent(targetUser.id)}/reposts`;
  let repostsResponse: Response;

  try {
    repostsResponse = await fetch(repostsUrl, {
      headers: authHeaders,
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao carregar reposts do usuário.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const repostsBody = await repostsResponse.json().catch(() => null);

  if (repostsResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(
        repostsBody,
        'Sessão expirada. Faça login novamente.',
      ),
    );
  }

  if (!repostsResponse.ok) {
    const message = resolveErrorMessage(
      repostsBody,
      'Não foi possível carregar os reposts do usuário.',
    );

    return NextResponse.json({ message }, { status: repostsResponse.status });
  }

  const reposts = Array.isArray(repostsBody) ? repostsBody : [];

  return NextResponse.json({ reposts }, { status: 200 });
}

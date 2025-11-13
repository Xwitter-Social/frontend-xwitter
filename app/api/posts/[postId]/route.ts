import { NextResponse } from 'next/server';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../../_lib/backend';

interface RouteContext {
  params: Promise<{
    postId?: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { postId } = await context.params;

  if (!postId) {
    return NextResponse.json(
      { message: 'Identificador do post não informado.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const backendUrl = `${getBackendUrl()}/post/${postId}`;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
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
      'Não foi possível carregar o post solicitado.',
    );

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json({ post: responseBody }, { status: 200 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { postId } = await context.params;

  if (!postId) {
    return NextResponse.json(
      { message: 'Identificador do post não informado.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const backendUrl = `${getBackendUrl()}/post/${postId}`;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
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
      'Não foi possível excluir o post.',
    );

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json({ post: responseBody }, { status: 200 });
}

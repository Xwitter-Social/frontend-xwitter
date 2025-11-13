import { NextResponse } from 'next/server';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../../../_lib/backend';

interface RouteContext {
  params: Promise<{
    postId?: string;
  }>;
}

const LIKE_ERROR_MESSAGE = 'Não foi possível curtir o post.';
const UNLIKE_ERROR_MESSAGE = 'Não foi possível remover a curtida do post.';

export async function POST(request: Request, context: RouteContext) {
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

  const backendUrl = `${getBackendUrl()}/interaction/like/${postId}`;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : LIKE_ERROR_MESSAGE;
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(responseBody, LIKE_ERROR_MESSAGE);

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const message = resolveErrorMessage(
    responseBody,
    'Post curtido com sucesso.',
  );

  return NextResponse.json({ message }, { status: 201 });
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

  const backendUrl = `${getBackendUrl()}/interaction/like/${postId}`;

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
      error instanceof Error ? error.message : UNLIKE_ERROR_MESSAGE;
    return NextResponse.json({ message }, { status: 502 });
  }

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(responseBody, UNLIKE_ERROR_MESSAGE);

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const message = resolveErrorMessage(
    responseBody,
    'Curtida removida com sucesso.',
  );

  return NextResponse.json({ message }, { status: backendResponse.status });
}

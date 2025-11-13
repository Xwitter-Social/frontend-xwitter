import { NextResponse } from 'next/server';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../../_lib/backend';

interface RouteContext {
  params: Promise<{
    commentId?: string;
  }>;
}

const DELETE_COMMENT_ERROR = 'Não foi possível remover o comentário.';

export async function DELETE(request: Request, context: RouteContext) {
  const { commentId } = await context.params;

  if (!commentId) {
    return NextResponse.json(
      { message: 'Identificador do comentário não informado.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const backendUrl = `${getBackendUrl()}/interaction/comment/${commentId}`;

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
      error instanceof Error ? error.message : DELETE_COMMENT_ERROR;
    return NextResponse.json({ message }, { status: 502 });
  }

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(responseBody, DELETE_COMMENT_ERROR);

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const message = resolveErrorMessage(
    responseBody,
    'Comentário removido com sucesso.',
  );

  return NextResponse.json({ message }, { status: backendResponse.status });
}

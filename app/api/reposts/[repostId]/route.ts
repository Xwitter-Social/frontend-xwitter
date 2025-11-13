import { NextResponse } from 'next/server';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../../_lib/backend';

interface RouteContext {
  params: Promise<{
    repostId?: string;
  }>;
}

const DELETE_REPOST_ERROR = 'Não foi possível remover o repost.';

export async function DELETE(request: Request, context: RouteContext) {
  const { repostId } = await context.params;

  if (!repostId) {
    return NextResponse.json(
      { message: 'Identificador do repost não informado.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const backendUrl = `${getBackendUrl()}/interaction/repost/${repostId}`;

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
      error instanceof Error ? error.message : DELETE_REPOST_ERROR;
    return NextResponse.json({ message }, { status: 502 });
  }

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(responseBody, DELETE_REPOST_ERROR);

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const message = resolveErrorMessage(
    responseBody,
    'Repost removido com sucesso.',
  );

  return NextResponse.json({ message }, { status: backendResponse.status });
}

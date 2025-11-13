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

async function resolveTargetUser(
  identifier: string,
  headers: Record<string, string>,
  backendUrl: string,
) {
  const targetUserUrl = `${backendUrl}/user/${encodeURIComponent(identifier)}`;

  try {
    const response = await fetch(targetUserUrl, {
      headers,
      cache: 'no-store',
    });
    const body = await response.json().catch(() => null);

    if (response.status === 401) {
      return {
        error: buildUnauthorizedResponse(
          resolveErrorMessage(body, 'Sessão expirada. Faça login novamente.'),
        ),
      } as const;
    }

    if (!response.ok) {
      const message = resolveErrorMessage(
        body,
        'Não foi possível localizar o usuário para seguir.',
      );

      return {
        error: NextResponse.json({ message }, { status: response.status }),
      } as const;
    }

    return { user: body as BackendUser } as const;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao carregar informações do usuário.';
    return {
      error: NextResponse.json({ message }, { status: 502 }),
    } as const;
  }
}

export async function POST(_request: Request, context: RouteContext) {
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

  const resolvedUser = await resolveTargetUser(
    identifier,
    authHeaders,
    backendUrl,
  );

  if ('error' in resolvedUser) {
    return resolvedUser.error;
  }

  const followUrl = `${backendUrl}/interaction/follow/${encodeURIComponent(resolvedUser.user.id)}`;

  let followResponse: Response;

  try {
    followResponse = await fetch(followUrl, {
      method: 'POST',
      headers: authHeaders,
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao seguir o usuário.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const followBody = await followResponse.json().catch(() => null);

  if (followResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(followBody, 'Sessão expirada. Faça login novamente.'),
    );
  }

  if (!followResponse.ok) {
    const message = resolveErrorMessage(
      followBody,
      'Não foi possível seguir este usuário.',
    );

    return NextResponse.json({ message }, { status: followResponse.status });
  }

  const message = resolveErrorMessage(
    followBody,
    'Usuário seguido com sucesso.',
  );
  return NextResponse.json({ message }, { status: 200 });
}

export async function DELETE(_request: Request, context: RouteContext) {
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

  const resolvedUser = await resolveTargetUser(
    identifier,
    authHeaders,
    backendUrl,
  );

  if ('error' in resolvedUser) {
    return resolvedUser.error;
  }

  const unfollowUrl = `${backendUrl}/interaction/follow/${encodeURIComponent(resolvedUser.user.id)}`;

  let unfollowResponse: Response;

  try {
    unfollowResponse = await fetch(unfollowUrl, {
      method: 'DELETE',
      headers: authHeaders,
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao deixar de seguir o usuário.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const unfollowBody = await unfollowResponse.json().catch(() => null);

  if (unfollowResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(
        unfollowBody,
        'Sessão expirada. Faça login novamente.',
      ),
    );
  }

  if (!unfollowResponse.ok) {
    const message = resolveErrorMessage(
      unfollowBody,
      'Não foi possível deixar de seguir este usuário.',
    );

    return NextResponse.json({ message }, { status: unfollowResponse.status });
  }

  return NextResponse.json(
    { message: 'Você deixou de seguir este usuário.' },
    { status: 200 },
  );
}

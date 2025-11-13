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
  username: string;
  name: string;
  bio?: string | null;
}

interface FollowersResponseUser {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  isCurrentUser: boolean;
  isFollowing: boolean;
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

  const currentUserUrl = `${backendUrl}/user/me`;
  const targetUserUrl = `${backendUrl}/user/${encodeURIComponent(identifier)}`;
  let currentUserResponse: Response;
  let targetUserResponse: Response;

  try {
    [currentUserResponse, targetUserResponse] = await Promise.all([
      fetch(currentUserUrl, { headers: authHeaders, cache: 'no-store' }),
      fetch(targetUserUrl, { headers: authHeaders, cache: 'no-store' }),
    ]);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao carregar dados do usuário.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const currentUserBody = await currentUserResponse.json().catch(() => null);
  if (currentUserResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(
        currentUserBody,
        'Sessão expirada. Faça login novamente.',
      ),
    );
  }

  if (!currentUserResponse.ok) {
    const message = resolveErrorMessage(
      currentUserBody,
      'Não foi possível carregar o usuário autenticado.',
    );

    return NextResponse.json(
      { message },
      { status: currentUserResponse.status },
    );
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

  const followersUrl = `${backendUrl}/user/${encodeURIComponent(targetUser.id)}/followers`;
  let followersResponse: Response;

  try {
    followersResponse = await fetch(followersUrl, {
      headers: authHeaders,
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao carregar seguidores.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const followersBody = await followersResponse.json().catch(() => null);
  if (!followersResponse.ok) {
    const message = resolveErrorMessage(
      followersBody,
      'Não foi possível carregar os seguidores.',
    );

    if (followersResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: followersResponse.status });
  }

  const currentUser = currentUserBody as BackendUser;
  const followers = Array.isArray(followersBody)
    ? (followersBody as BackendUser[])
    : [];

  // Recupera a lista de usuários que o usuário atual segue para exibir status
  const viewerFollowingUrl = `${backendUrl}/user/${currentUser.id}/following`;
  let viewerFollowingResponse: Response;
  try {
    viewerFollowingResponse = await fetch(viewerFollowingUrl, {
      headers: authHeaders,
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao carregar relação de seguimento.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const viewerFollowingBody = await viewerFollowingResponse
    .json()
    .catch(() => null);
  if (!viewerFollowingResponse.ok) {
    const message = resolveErrorMessage(
      viewerFollowingBody,
      'Não foi possível carregar usuários seguidos.',
    );

    if (viewerFollowingResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json(
      { message },
      { status: viewerFollowingResponse.status },
    );
  }

  const viewerFollowing = Array.isArray(viewerFollowingBody)
    ? (viewerFollowingBody as BackendUser[])
    : [];
  const viewerFollowingSet = new Set(viewerFollowing.map((user) => user.id));

  const users: FollowersResponseUser[] = followers.map((user) => ({
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio ?? null,
    isCurrentUser: user.id === currentUser.id,
    isFollowing: viewerFollowingSet.has(user.id),
  }));

  return NextResponse.json({ users }, { status: 200 });
}

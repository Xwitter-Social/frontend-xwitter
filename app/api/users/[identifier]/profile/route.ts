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
  createdAt: string;
}

interface ProfileResponse {
  profile: {
    id: string;
    username: string;
    name: string;
    bio: string | null;
    createdAt: string;
  };
  stats: {
    followers: number;
    following: number;
  };
  viewerRelationship: {
    isCurrentUser: boolean;
    isFollowing: boolean;
  };
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

  const userUrl = `${backendUrl}/user/${encodeURIComponent(identifier)}`;
  const currentUserUrl = `${backendUrl}/user/me`;

  let userResponse: Response;
  let currentUserResponse: Response;

  try {
    [userResponse, currentUserResponse] = await Promise.all([
      fetch(userUrl, { headers: authHeaders, cache: 'no-store' }),
      fetch(currentUserUrl, { headers: authHeaders, cache: 'no-store' }),
    ]);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão com o servidor de usuários.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const userBody = await userResponse.json().catch(() => null);
  if (!userResponse.ok) {
    const message = resolveErrorMessage(
      userBody,
      'Não foi possível carregar o perfil solicitado.',
    );

    if (userResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: userResponse.status });
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

  const targetUser = userBody as BackendUser;
  const currentUser = currentUserBody as BackendUser;

  const followersUrl = `${backendUrl}/user/${targetUser.id}/followers`;
  const followingUrl = `${backendUrl}/user/${targetUser.id}/following`;

  let followersResponse: Response;
  let followingResponse: Response;

  try {
    [followersResponse, followingResponse] = await Promise.all([
      fetch(followersUrl, { headers: authHeaders, cache: 'no-store' }),
      fetch(followingUrl, { headers: authHeaders, cache: 'no-store' }),
    ]);
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
      'Não foi possível carregar os seguidores do usuário.',
    );

    if (followersResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: followersResponse.status });
  }

  const followingBody = await followingResponse.json().catch(() => null);
  if (!followingResponse.ok) {
    const message = resolveErrorMessage(
      followingBody,
      'Não foi possível carregar os usuários seguidos.',
    );

    if (followingResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: followingResponse.status });
  }

  const followers = Array.isArray(followersBody) ? followersBody : [];
  const following = Array.isArray(followingBody) ? followingBody : [];

  const isCurrentUser = currentUser.id === targetUser.id;
  const isFollowing = isCurrentUser
    ? false
    : followers.some((follower) => follower?.id === currentUser.id);

  const response: ProfileResponse = {
    profile: {
      id: targetUser.id,
      username: targetUser.username,
      name: targetUser.name,
      bio: targetUser.bio ?? null,
      createdAt: targetUser.createdAt,
    },
    stats: {
      followers: followers.length,
      following: following.length,
    },
    viewerRelationship: {
      isCurrentUser,
      isFollowing,
    },
  };

  return NextResponse.json(response, { status: 200 });
}

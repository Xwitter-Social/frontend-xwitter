import { NextResponse } from 'next/server';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../../_lib/backend';

interface BackendUser {
  id: string;
  username: string;
  name: string;
  bio?: string | null;
}

interface SearchUser {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  isCurrentUser: boolean;
  isFollowing: boolean;
}

function extractQuery(request: Request): string {
  try {
    const url = new URL(request.url);
    return url.searchParams.get('search')?.trim() ?? '';
  } catch {
    return '';
  }
}

function buildUsersResponse(
  users: BackendUser[],
  currentUser: BackendUser,
  viewerFollowing: BackendUser[],
): SearchUser[] {
  const followingSet = new Set(viewerFollowing.map((user) => user.id));

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio ?? null,
    isCurrentUser: user.id === currentUser.id,
    isFollowing: followingSet.has(user.id),
  }));
}

export async function GET(request: Request) {
  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const query = extractQuery(request);

  if (!query) {
    return NextResponse.json({ users: [] }, { status: 200 });
  }

  const backendBaseUrl = getBackendUrl();
  const authHeaders = {
    Authorization: `Bearer ${token}`,
  } as const;

  const searchUrl = new URL(`${backendBaseUrl}/user/search`);
  searchUrl.searchParams.set('search', query);

  const currentUserUrl = `${backendBaseUrl}/user/me`;

  let currentUserResponse: Response;
  let searchResponse: Response;

  try {
    [currentUserResponse, searchResponse] = await Promise.all([
      fetch(currentUserUrl, { headers: authHeaders, cache: 'no-store' }),
      fetch(searchUrl.toString(), { headers: authHeaders, cache: 'no-store' }),
    ]);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão com o servidor de usuários.';
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

  const searchBody = await searchResponse.json().catch(() => null);
  if (searchResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(searchBody, 'Sessão expirada. Faça login novamente.'),
    );
  }

  if (!searchResponse.ok) {
    const message = resolveErrorMessage(
      searchBody,
      'Não foi possível realizar a busca de usuários.',
    );

    return NextResponse.json({ message }, { status: searchResponse.status });
  }

  const backendUsers = Array.isArray(searchBody)
    ? (searchBody as BackendUser[])
    : [];

  const currentUser = currentUserBody as BackendUser;

  if (backendUsers.length === 0) {
    return NextResponse.json({ users: [] }, { status: 200 });
  }

  const viewerFollowingUrl = `${backendBaseUrl}/user/${currentUser.id}/following`;
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
        : 'Erro de conexão ao carregar usuários seguidos.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const viewerFollowingBody = await viewerFollowingResponse
    .json()
    .catch(() => null);

  if (viewerFollowingResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(
        viewerFollowingBody,
        'Sessão expirada. Faça login novamente.',
      ),
    );
  }

  if (!viewerFollowingResponse.ok) {
    const message = resolveErrorMessage(
      viewerFollowingBody,
      'Não foi possível carregar usuários seguidos.',
    );

    return NextResponse.json(
      { message },
      { status: viewerFollowingResponse.status },
    );
  }

  const viewerFollowing = Array.isArray(viewerFollowingBody)
    ? (viewerFollowingBody as BackendUser[])
    : [];

  const users = buildUsersResponse(backendUsers, currentUser, viewerFollowing);

  return NextResponse.json({ users }, { status: 200 });
}

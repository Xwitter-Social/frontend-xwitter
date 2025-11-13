import { NextResponse } from 'next/server';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../_lib/backend';

interface UpdateAccountRequestBody {
  id?: unknown;
  name?: unknown;
  username?: unknown;
  email?: unknown;
  bio?: unknown;
  password?: unknown;
}

interface DeleteAccountRequestBody {
  id?: unknown;
}

function ensureString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return value;
}

export async function PATCH(request: Request) {
  let body: UpdateAccountRequestBody | null = null;

  try {
    body = (await request.json()) as UpdateAccountRequestBody;
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível ler os dados enviados.' },
      { status: 400 },
    );
  }

  const userId = ensureString(body?.id);

  if (!userId) {
    return NextResponse.json(
      { message: 'Identificador do usuário é obrigatório.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const updates: Record<string, string> = {};

  if (typeof body?.name === 'string') {
    const trimmedName = body.name.trim();

    if (!trimmedName) {
      return NextResponse.json(
        { message: 'Nome não pode ficar em branco.' },
        { status: 400 },
      );
    }

    updates.name = trimmedName;
  }

  if (typeof body?.username === 'string') {
    const trimmedUsername = body.username.trim();

    if (!trimmedUsername) {
      return NextResponse.json(
        { message: 'Nome de usuário não pode ficar em branco.' },
        { status: 400 },
      );
    }

    updates.username = trimmedUsername;
  }

  if (typeof body?.email === 'string') {
    const trimmedEmail = body.email.trim();

    if (!trimmedEmail) {
      return NextResponse.json(
        { message: 'Email não pode ficar em branco.' },
        { status: 400 },
      );
    }

    updates.email = trimmedEmail;
  }

  if (typeof body?.bio === 'string') {
    updates.bio = body.bio.trim();
  }

  if (typeof body?.password === 'string') {
    const trimmedPassword = body.password.trim();

    if (trimmedPassword.length > 0) {
      updates.password = trimmedPassword;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { message: 'Nenhuma alteração foi informada.' },
      { status: 400 },
    );
  }

  const backendUrl = getBackendUrl();
  const targetUrl = `${backendUrl}/user/${encodeURIComponent(userId)}`;

  let backendResponse: Response;

  try {
    backendResponse = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão ao atualizar o perfil.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (backendResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(
        responseBody,
        'Sessão expirada. Faça login novamente.',
      ),
    );
  }

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(
      responseBody,
      'Não foi possível atualizar o perfil.',
    );

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json(
    {
      user: responseBody,
      message: 'Perfil atualizado com sucesso.',
    },
    { status: 200 },
  );
}

export async function DELETE(request: Request) {
  let body: DeleteAccountRequestBody | null = null;

  try {
    body = (await request
      .json()
      .catch(() => null)) as DeleteAccountRequestBody | null;
  } catch {
    body = null;
  }

  const searchParams = new URL(request.url).searchParams;
  const idFromBody = ensureString(body?.id);
  const idFromQuery = searchParams.get('id');
  const userId = idFromBody ?? idFromQuery;

  if (!userId) {
    return NextResponse.json(
      { message: 'Identificador do usuário é obrigatório.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const backendUrl = getBackendUrl();
  const targetUrl = `${backendUrl}/user/${encodeURIComponent(userId)}`;

  let backendResponse: Response;

  try {
    backendResponse = await fetch(targetUrl, {
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
        : 'Erro de conexão ao excluir a conta.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (backendResponse.status === 401) {
    return buildUnauthorizedResponse(
      resolveErrorMessage(
        responseBody,
        'Sessão expirada. Faça login novamente.',
      ),
    );
  }

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(
      responseBody,
      'Não foi possível excluir a conta.',
    );

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json(
    { message: 'Conta excluída com sucesso.' },
    { status: 200 },
  );
}

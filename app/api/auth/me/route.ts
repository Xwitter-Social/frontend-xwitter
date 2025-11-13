import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/constants';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

function getBackendUrl() {
  if (!BACKEND_API_URL) {
    throw new Error('BACKEND_API_URL não está configurada.');
  }
  return BACKEND_API_URL.replace(/\/?$/, '');
}

function resolveErrorMessage(errorBody: unknown): string {
  if (!errorBody) {
    return 'Erro inesperado ao comunicar com o servidor.';
  }

  if (typeof errorBody === 'string') {
    return errorBody;
  }

  if (Array.isArray(errorBody)) {
    return errorBody.join(' ');
  }

  if (typeof errorBody === 'object' && errorBody !== null) {
    const possibleMessage = (errorBody as { message?: unknown }).message;
    if (typeof possibleMessage === 'string') {
      return possibleMessage;
    }
    if (Array.isArray(possibleMessage)) {
      return possibleMessage.join(' ');
    }
  }

  return 'Não foi possível obter os dados do usuário.';
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Usuário não autenticado.' },
      { status: 401 },
    );
  }

  const backendUrl = `${getBackendUrl()}/user/me`;

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
        : 'Erro de conexão com o servidor de usuários.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(responseBody);
    if (backendResponse.status === 401) {
      const response = NextResponse.json({ message }, { status: 401 });
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json({ user: responseBody }, { status: 200 });
}

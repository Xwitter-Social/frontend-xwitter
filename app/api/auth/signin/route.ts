import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AUTH_COOKIE_NAME } from '@/lib/constants';

const signInSchema = z.object({
  identifier: z.string().min(1, 'Identificador é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

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

  return 'Não foi possível concluir o login.';
}

export async function POST(request: Request) {
  let payload: z.infer<typeof signInSchema>;

  try {
    const rawBody = await request.json();
    const parsed = signInSchema.safeParse(rawBody);

    if (!parsed.success) {
      const formatted = parsed.error.issues
        .map((issue) => issue.message)
        .join(' ');
      return NextResponse.json({ message: formatted }, { status: 400 });
    }

    payload = parsed.data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível ler a requisição.';
    return NextResponse.json({ message }, { status: 400 });
  }

  const backendUrl = `${getBackendUrl()}/auth/signin`;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão com o servidor de autenticação.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(responseBody);
    return NextResponse.json(
      { message },
      { status: backendResponse.status === 401 ? 401 : 400 },
    );
  }

  const { accessToken } = responseBody as { accessToken?: string };

  if (!accessToken) {
    return NextResponse.json(
      { message: 'Resposta do servidor inválida: token ausente.' },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
}

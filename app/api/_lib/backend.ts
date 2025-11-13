import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/constants';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export function getBackendUrl(): string {
  if (!BACKEND_API_URL) {
    throw new Error('BACKEND_API_URL não está configurada.');
  }

  return BACKEND_API_URL.replace(/\/?$/, '');
}

export function resolveErrorMessage(
  errorBody: unknown,
  fallbackMessage: string,
): string {
  if (!errorBody) {
    return fallbackMessage;
  }

  if (typeof errorBody === 'string') {
    return errorBody;
  }

  if (Array.isArray(errorBody)) {
    return errorBody.join(' ');
  }

  if (typeof errorBody === 'object') {
    const possibleMessage = (errorBody as { message?: unknown }).message;

    if (typeof possibleMessage === 'string') {
      return possibleMessage;
    }

    if (Array.isArray(possibleMessage)) {
      return possibleMessage.join(' ');
    }
  }

  return fallbackMessage;
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export function buildUnauthorizedResponse(message: string): NextResponse {
  const response = NextResponse.json({ message }, { status: 401 });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

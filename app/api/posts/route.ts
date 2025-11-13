import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../_lib/backend';

const createPostSchema = z.object({
  content: z
    .string({ required_error: 'Conteúdo é obrigatório.' })
    .trim()
    .min(1, 'Conteúdo não pode ser vazio.')
    .max(280, 'Conteúdo deve ter no máximo 280 caracteres.'),
});

export async function POST(request: Request) {
  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  let payload: z.infer<typeof createPostSchema>;
  try {
    const rawBody = await request.json();
    const parsed = createPostSchema.safeParse(rawBody);

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

  const backendUrl = `${getBackendUrl()}/post`;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro de conexão com o servidor de posts.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(
      responseBody,
      'Não foi possível publicar o post.',
    );
    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json({ post: responseBody }, { status: 201 });
}

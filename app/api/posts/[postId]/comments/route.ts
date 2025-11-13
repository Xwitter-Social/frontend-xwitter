import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  buildUnauthorizedResponse,
  getAuthToken,
  getBackendUrl,
  resolveErrorMessage,
} from '../../../_lib/backend';

interface RouteContext {
  params: Promise<{
    postId?: string;
  }>;
}

const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Conteúdo é obrigatório.' })
    .trim()
    .min(1, 'Conteúdo não pode ser vazio.')
    .max(280, 'Comentário deve ter no máximo 280 caracteres.'),
  parentCommentId: z
    .string()
    .uuid('Identificador do comentário pai inválido.')
    .optional()
    .nullable()
    .transform((value) => value ?? undefined),
});

const CREATE_COMMENT_ERROR = 'Não foi possível publicar o comentário.';

export async function POST(request: Request, context: RouteContext) {
  const { postId } = await context.params;

  if (!postId) {
    return NextResponse.json(
      { message: 'Identificador do post não informado.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  let payload: z.infer<typeof createCommentSchema>;

  try {
    const rawBody = await request.json();
    const parsed = createCommentSchema.safeParse(rawBody);

    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => issue.message)
        .join(' ');
      return NextResponse.json({ message }, { status: 400 });
    }

    payload = parsed.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Corpo da requisição inválido.';
    return NextResponse.json({ message }, { status: 400 });
  }

  const backendUrl = `${getBackendUrl()}/interaction/comment`;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId,
        content: payload.content,
        parentCommentId: payload.parentCommentId,
      }),
      cache: 'no-store',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : CREATE_COMMENT_ERROR;
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(responseBody, CREATE_COMMENT_ERROR);

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json({ comment: responseBody }, { status: 201 });
}

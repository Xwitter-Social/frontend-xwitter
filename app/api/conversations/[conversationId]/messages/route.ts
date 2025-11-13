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
    conversationId?: string;
  }>;
}

const sendMessageSchema = z.object({
  content: z
    .string({ required_error: 'Conteúdo é obrigatório.' })
    .trim()
    .min(1, 'Mensagem não pode ser vazia.')
    .max(1000, 'Mensagem deve ter no máximo 1000 caracteres.'),
});

export async function GET(_request: Request, context: RouteContext) {
  const { conversationId } = await context.params;

  if (!conversationId) {
    return NextResponse.json(
      { message: 'Identificador da conversa não informado.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  const backendUrl = `${getBackendUrl()}/conversation/${encodeURIComponent(conversationId)}/messages`;

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
        : 'Erro de conexão ao carregar mensagens.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(
      responseBody,
      'Não foi possível carregar as mensagens desta conversa.',
    );

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const messages = Array.isArray(responseBody) ? responseBody : [];

  return NextResponse.json({ messages }, { status: 200 });
}

export async function POST(request: Request, context: RouteContext) {
  const { conversationId } = await context.params;

  if (!conversationId) {
    return NextResponse.json(
      { message: 'Identificador da conversa não informado.' },
      { status: 400 },
    );
  }

  const token = await getAuthToken();

  if (!token) {
    return buildUnauthorizedResponse('Usuário não autenticado.');
  }

  let payload: z.infer<typeof sendMessageSchema>;
  try {
    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

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

  const backendUrl = `${getBackendUrl()}/conversation/${encodeURIComponent(conversationId)}/messages`;

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
        : 'Erro de conexão ao enviar mensagem.';
    return NextResponse.json({ message }, { status: 502 });
  }

  const responseBody = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    const message = resolveErrorMessage(
      responseBody,
      'Não foi possível enviar a mensagem.',
    );

    if (backendResponse.status === 401) {
      return buildUnauthorizedResponse(message);
    }

    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json({ createdMessage: responseBody }, { status: 201 });
}

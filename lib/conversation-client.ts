import type {
  ConversationCreatedMessageResponse,
  ConversationListResponse,
  ConversationMessagesResponse,
  StartConversationPayload,
} from '@/types/conversation';

interface ApiErrorResponse {
  message?: unknown;
}

async function readJson<T>(
  response: Response,
): Promise<T | ApiErrorResponse | null> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as T | ApiErrorResponse;
  } catch (error) {
    console.error('Não foi possível interpretar a resposta da API.', error);
    return null;
  }
}

function extractMessage(body: ApiErrorResponse | null, fallback: string) {
  if (!body) {
    return fallback;
  }

  if (typeof body.message === 'string') {
    return body.message;
  }

  if (Array.isArray(body.message)) {
    return body.message.join(' ');
  }

  return fallback;
}

function asErrorResponse(
  body: ConversationListResponse | ApiErrorResponse | null,
): ApiErrorResponse | null;
function asErrorResponse(
  body: ConversationMessagesResponse | ApiErrorResponse | null,
): ApiErrorResponse | null;
function asErrorResponse(
  body: ConversationCreatedMessageResponse | ApiErrorResponse | null,
): ApiErrorResponse | null;
function asErrorResponse(
  body: { conversation: { id: string } } | ApiErrorResponse | null,
): ApiErrorResponse | null;
function asErrorResponse(body: unknown): ApiErrorResponse | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  if ('message' in body) {
    return body as ApiErrorResponse;
  }

  return null;
}

export async function fetchConversations(): Promise<ConversationListResponse> {
  const response = await fetch('/api/conversations', {
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readJson<ConversationListResponse>(response);

  if (!response.ok) {
    const errorBody = asErrorResponse(body);
    const error = new Error(
      extractMessage(errorBody, 'Não foi possível carregar suas conversas.'),
    );
    if (response.status === 401) {
      error.name = 'UnauthorizedError';
    }

    throw error;
  }

  if (!body || !('conversations' in body)) {
    return { conversations: [] };
  }

  return body as ConversationListResponse;
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<ConversationMessagesResponse> {
  const response = await fetch(
    `/api/conversations/${conversationId}/messages`,
    {
      credentials: 'include',
      cache: 'no-store',
    },
  );

  const body = await readJson<ConversationMessagesResponse>(response);

  if (!response.ok) {
    const errorBody = asErrorResponse(body);
    const error = new Error(
      extractMessage(
        errorBody,
        'Não foi possível carregar as mensagens desta conversa.',
      ),
    );
    if (response.status === 401) {
      error.name = 'UnauthorizedError';
    }

    throw error;
  }

  if (!body || !('messages' in body)) {
    return { messages: [] };
  }

  return body as ConversationMessagesResponse;
}

export async function sendConversationMessage(
  conversationId: string,
  content: string,
): Promise<ConversationCreatedMessageResponse> {
  const response = await fetch(
    `/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
      credentials: 'include',
      cache: 'no-store',
    },
  );

  const body = await readJson<ConversationCreatedMessageResponse>(response);

  if (!response.ok) {
    const errorBody = asErrorResponse(body);
    const error = new Error(
      extractMessage(errorBody, 'Não foi possível enviar a mensagem.'),
    );
    if (response.status === 401) {
      error.name = 'UnauthorizedError';
    }

    throw error;
  }

  if (!body || !('createdMessage' in body)) {
    throw new Error('Resposta inválida ao enviar a mensagem.');
  }

  return body as ConversationCreatedMessageResponse;
}

export async function startConversation(
  payload: StartConversationPayload,
): Promise<string> {
  const response = await fetch('/api/conversations/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    credentials: 'include',
    cache: 'no-store',
  });

  const body = await readJson<{ conversation: { id: string } }>(response);

  if (!response.ok) {
    const errorBody = asErrorResponse(body);
    const error = new Error(
      extractMessage(errorBody, 'Não foi possível iniciar a conversa.'),
    );
    if (response.status === 401) {
      error.name = 'UnauthorizedError';
    }

    throw error;
  }

  if (!body || !('conversation' in body)) {
    throw new Error('Resposta inválida ao iniciar a conversa.');
  }

  return body.conversation.id;
}

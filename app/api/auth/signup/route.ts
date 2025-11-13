import { NextResponse } from 'next/server';
import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres'),
  email: z.string().email('Formato de email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um símbolo'),
  bio: z.string().max(160, 'Bio deve ter no máximo 160 caracteres').optional(),
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

  return 'Não foi possível concluir o cadastro.';
}

export async function POST(request: Request) {
  let payload: z.infer<typeof signUpSchema>;

  try {
    const rawBody = await request.json();
    const parsed = signUpSchema.safeParse(rawBody);

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

  const backendUrl = `${getBackendUrl()}/user`;

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
        : 'Erro de conexão com o servidor de usuários.';
    return NextResponse.json({ message }, { status: 502 });
  }

  if (!backendResponse.ok) {
    const responseBody = await backendResponse.json().catch(() => null);
    const message = resolveErrorMessage(responseBody);
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

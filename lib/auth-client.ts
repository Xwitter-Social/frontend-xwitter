export interface SignInPayload {
  identifier: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  bio?: string;
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const body = isJson ? ((await response.json()) as ApiResponse) : null;

  if (!response.ok) {
    const errorMessage =
      (body?.message && typeof body.message === 'string' && body.message) ||
      'Ocorreu um erro durante a requisição.';
    throw new Error(errorMessage);
  }

  return body;
}

export async function signIn(payload: SignInPayload): Promise<void> {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(response);
}

export async function signUp(payload: SignUpPayload): Promise<void> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(response);
}

export async function signOut(): Promise<void> {
  const response = await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include',
  });

  await handleResponse(response);
}

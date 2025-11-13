import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/constants';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

export async function DELETE() {
  return POST();
}

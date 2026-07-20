import { NextResponse } from 'next/server';
import { signOut } from '@/adapters/auth';

export async function POST() {
  await signOut();
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'mock-auth',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

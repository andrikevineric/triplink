import { cookies } from 'next/headers';
import { prisma } from './prisma';

const TOKEN_COOKIE = 'triplink_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { token },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
}

export function setAuthCookie(token: string) {
  cookies().set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

export function clearAuthCookie() {
  cookies().delete(TOKEN_COOKIE);
}

import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET — кто я + список пользователей для демо-переключателя
export async function GET() {
  const me = await getCurrentUser();
  return NextResponse.json({ me, users: q.listUsers() });
}

// POST {userId} — переключить пользователя (демо-аутентификация, httpOnly cookie)
export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  const user = q.getUser(Number(userId));
  if (!user) return NextResponse.json({ error: 'пользователь не найден' }, { status: 404 });
  const res = NextResponse.json({ me: user });
  res.cookies.set('pp-user', String(user.id), { httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}

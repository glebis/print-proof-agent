import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// Админка: CRUD пользователей. Только role=admin.
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'admin')) return forbidden('только администратор управляет пользователями');

  const body = await req.json();
  if (body.delete) {
    if (Number(body.delete) === me.id) return NextResponse.json({ error: 'нельзя удалить себя' }, { status: 400 });
    q.deleteUser(Number(body.delete));
  } else if (body.id) {
    q.updateUser(Number(body.id), { name: body.name, role: body.role, clientProfileId: body.clientProfileId ?? undefined });
  } else {
    if (!body.name || !body.role) return NextResponse.json({ error: 'нужны name и role' }, { status: 400 });
    q.createUser(String(body.name), String(body.role), body.clientProfileId ?? null);
  }
  return NextResponse.json({ users: q.listUsers() });
}

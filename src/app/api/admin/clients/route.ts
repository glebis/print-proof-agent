import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// Админка: клиенты (расширенные профили) — контакты и ответственный менеджер.
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'admin')) return forbidden('только администратор управляет клиентами');

  const body = await req.json();
  q.updateProfileContacts(Number(body.id), {
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone,
    managerUserId: body.managerUserId === undefined ? undefined : body.managerUserId,
  });
  return NextResponse.json({ profiles: q.listProfiles() });
}

import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getCurrentUser, unauthorized } from '@/lib/auth';

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  // клиент видит только свой профиль; staff — все
  const all = q.listProfiles();
  if (me.role === 'client') return NextResponse.json(all.filter((p) => p.id === me.clientProfileId));
  return NextResponse.json(all);
}

import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// Прямое (не-чатовое) редактирование профиля: PATCH принимает любые поля частично.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'edit_profiles')) return forbidden('профили редактируют менеджер и администратор');
  const { id } = await params;
  const body = await req.json();
  try {
    q.updateProfile(Number(id), { name: body.name, rules: body.rules, notes: body.notes });
    return NextResponse.json(q.listProfiles().find((p) => p.id === Number(id)));
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 404 });
  }
}

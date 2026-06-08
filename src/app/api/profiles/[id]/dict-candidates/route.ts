import { NextRequest, NextResponse } from 'next/server';
import db, { q } from '@/lib/db';
import { suggestDictionaryCandidates } from '@/lib/dictionary-suggest';
import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// Самообучение словаря: повторяющиеся принятые llm-правки по заказам профиля → кандидаты в бренд-словарь.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'edit_profiles')) return forbidden();

  const { id } = await params;
  const profile = q.getProfile(Number(id));
  if (!profile) return NextResponse.json({ error: 'профиль не найден' }, { status: 404 });

  const edits = (db
    .prepare('SELECT e.* FROM edits e JOIN orders o ON o.id = e.order_id WHERE o.client_profile_id = ?')
    .all(Number(id)) as any[])
    .map((r) => ({
      ...r,
      orderId: r.order_id, spanStart: r.span_start, spanEnd: r.span_end, baseRevision: r.base_revision,
      contextBefore: r.context_before, contextAfter: r.context_after, sourceModule: r.source_module,
    }));

  return NextResponse.json(suggestDictionaryCandidates(edits as any, profile.rules.brandDictionary ?? {}));
}

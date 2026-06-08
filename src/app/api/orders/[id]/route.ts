import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getCurrentUser, unauthorized, forbidden } from '@/lib/auth';
import { canAccessOrder } from '@/lib/order-access';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const orderId = Number(id);
  const order = q.getOrder(orderId);
  if (!order) return NextResponse.json({ error: 'не найден' }, { status: 404 });
  if (!canAccessOrder(me, order, () => q.listLayoutIssues(orderId).length > 0)) return forbidden('нет доступа к заказу');

  const protocol = q.getArtifact(orderId, 'protocol');
  return NextResponse.json({
    order,
    renderPages: q.listArtifacts(orderId, 'page_render').length, // 0 для картинок/текста
    text: q.getArtifact(orderId, 'parsed_text')?.content ?? '',
    edits: q.listEdits(orderId),
    layoutIssues: q.listLayoutIssues(orderId),
    profile: q.getProfile(order.clientProfileId ?? null) ?? null,
    protocol: protocol?.content ? JSON.parse(protocol.content) : null,
  });
}

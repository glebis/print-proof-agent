import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { buildOrderArchive } from '@/lib/archive';
import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// Полный архив заказа: самодостаточный JSON для долговременного хранения и аудита.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'export')) return forbidden('архив доступен менеджеру и администратору');

  const { id } = await params;
  const orderId = Number(id);
  const order = q.getOrder(orderId);
  if (!order) return NextResponse.json({ error: 'не найден' }, { status: 404 });

  const protocol = q.getArtifact(orderId, 'protocol');
  const archive = buildOrderArchive(
    {
      order: order as any,
      text: q.getArtifact(orderId, 'parsed_text')?.content ?? '',
      edits: q.listEdits(orderId),
      layoutIssues: q.listLayoutIssues(orderId),
      protocol: protocol?.content ? JSON.parse(protocol.content) : null,
      profile: (q.getProfile(order.clientProfileId ?? null) as any) ?? null,
    },
    new Date().toISOString(),
  );
  return new NextResponse(JSON.stringify(archive, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="order-${orderId}-archive.json"`,
    },
  });
}

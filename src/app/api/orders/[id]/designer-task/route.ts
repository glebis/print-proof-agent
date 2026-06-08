import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { buildDesignerTask } from '@/lib/designer-task';
import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// «Задание дизайнеру» — markdown-чеклист vision-замечаний (без отклонённых менеджером).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'view_layout_tasks')) return forbidden('задание дизайнеру доступно менеджеру, дизайнеру и администратору');

  const { id } = await params;
  const orderId = Number(id);
  const order = q.getOrder(orderId);
  if (!order) return NextResponse.json({ error: 'не найден' }, { status: 404 });

  const md = buildDesignerTask({ id: orderId, filename: order.filename }, q.listLayoutIssues(orderId));
  return new NextResponse(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="designer-task-${orderId}.md"`,
    },
  });
}

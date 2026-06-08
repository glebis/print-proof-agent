import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { q } from '@/lib/db';
import { canRecheck } from '@/lib/recheck';
import { planCheck } from '@/lib/queue';
import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// Перепроверка: после изменения профиля/словаря. Решения менеджера переживают (clearUndecidedEdits).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'decide')) return forbidden('перепроверку запускает менеджер или администратор');

  const { id } = await params;
  const orderId = Number(id);
  const order = q.getOrder(orderId);
  if (!order) return NextResponse.json({ error: 'не найден' }, { status: 404 });
  if (!canRecheck(order.status)) {
    return NextResponse.json({ error: `перепроверка недоступна в статусе «${order.status}»` }, { status: 409 });
  }

  const activeChecking = q.listOrders().filter((o) => o.status === 'checking').length;
  if (planCheck(activeChecking) === 'queue') {
    q.updateOrderStatus(orderId, 'queued');
    return NextResponse.json({ status: 'queued' });
  }
  const w = spawn('npx', ['tsx', 'scripts/run-check.ts', String(orderId)], { cwd: process.cwd(), detached: true, stdio: 'ignore' });
  w.unref();
  return NextResponse.json({ status: 'checking' });
}

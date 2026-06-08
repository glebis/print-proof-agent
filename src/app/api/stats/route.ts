import { NextResponse } from 'next/server';
import db, { q } from '@/lib/db';
import { computeSummary } from '@/lib/stats';
import { getCurrentUser, unauthorized } from '@/lib/auth';

// Сводка для руководства: заказы, объём, тариф, среднее время проверки, доля принятых правок.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return unauthorized();

  const orders = q.listOrders();
  const protocols = (db.prepare("SELECT content FROM artifacts WHERE kind = 'protocol' AND content IS NOT NULL").all() as any[])
    .map((r) => { try { return JSON.parse(r.content); } catch { return null; } })
    .filter(Boolean);
  const dec = db.prepare("SELECT SUM(decision='accepted') a, SUM(decision='rejected') r FROM edits").get() as any;

  return NextResponse.json(computeSummary(orders, protocols, { accepted: dec.a ?? 0, rejected: dec.r ?? 0 }));
}

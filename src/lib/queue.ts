// Очередь проверок: не больше CHECK_CONCURRENCY каскадов одновременно.
// Лишние заказы получают статус 'queued'; освободившийся воркер подхватывает самый старый.
import type { Order } from '@/lib/types';

export const CHECK_CONCURRENCY = 2;

export function planCheck(activeChecking: number): 'run' | 'queue' {
  return activeChecking < CHECK_CONCURRENCY ? 'run' : 'queue';
}

export function pickNextQueued(orders: Pick<Order, 'id' | 'status' | 'createdAt'>[]): { id: number } | null {
  const queued = orders
    .filter((o) => o.status === 'queued')
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  return queued.length ? { id: queued[0].id! } : null;
}

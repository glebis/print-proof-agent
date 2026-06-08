// SLA-бейдж: укладывается ли активная проверка в обещанную оценку времени.
// Оценивается только активная работа (uploaded/estimated/queued/checking) — предсказуемость и есть продукт.
interface OrderSla {
  status: string;
  createdAt?: string;
  etaMinutes?: number;
}

const ACTIVE = new Set(['uploaded', 'estimated', 'queued', 'checking']);

export function slaStatus(order: OrderSla, now: Date): { state: 'ok' | 'overdue' | 'n/a'; overdueMinutes: number } {
  if (!ACTIVE.has(order.status) || !order.etaMinutes || !order.createdAt) {
    return { state: 'n/a', overdueMinutes: 0 };
  }
  // SQLite datetime('now') пишет UTC без зоны — нормализуем
  const created = new Date(order.createdAt.replace(' ', 'T') + (order.createdAt.includes('Z') ? '' : 'Z'));
  const elapsedMin = (now.getTime() - created.getTime()) / 60000;
  const overdue = Math.floor(elapsedMin - order.etaMinutes);
  return overdue > 0 ? { state: 'overdue', overdueMinutes: overdue } : { state: 'ok', overdueMinutes: 0 };
}

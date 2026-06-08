// Перепроверка заказа: разрешена только из терминальных состояний.
// runCheck идемпотентен — решения менеджера переживают повторный прогон (clearUndecidedEdits).
import type { OrderStatus } from '@/lib/types';

const RECHECKABLE: OrderStatus[] = ['review', 'done', 'error'];

export function canRecheck(status: string): boolean {
  return RECHECKABLE.includes(status as OrderStatus);
}

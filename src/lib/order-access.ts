// Object-level ACL: может ли пользователь видеть конкретный заказ (Codex risk #2).
// Дополняет ролевые права из lib/auth: admin/manager — всё; client — свой профиль;
// designer — только заказы с заданиями по макету.
import type { CurrentUser } from '@/lib/auth';

export function canAccessOrder(
  user: CurrentUser | null,
  order: { clientProfileId?: number | null },
  hasLayoutTasks: () => boolean,
): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'manager') return true;
  if (user.role === 'client') return order.clientProfileId === user.clientProfileId;
  if (user.role === 'designer') return hasLayoutTasks();
  return false;
}

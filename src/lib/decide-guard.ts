// Защита приёмки: правка из тела запроса должна принадлежать заказу из URL.
// Иначе менеджер заказа A мог бы менять решения по правкам заказа B (Codex risk #4).
import type { Edit, LayoutIssue } from '@/lib/types';

export function editBelongsToOrder(edit: Edit | undefined | null, orderId: number): boolean {
  return !!edit && edit.orderId === orderId;
}

export function layoutIssueBelongsToOrder(issue: LayoutIssue | undefined | null, orderId: number): boolean {
  return !!issue && issue.orderId === orderId;
}

// ACL: текущий пользователь из cookie (демо-переключатель, без паролей)
// и проверки прав по ролям. Роли: admin > manager > designer/client (узкие).
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

export interface CurrentUser {
  id: number;
  name: string;
  role: 'admin' | 'manager' | 'client' | 'designer';
  clientProfileId: number | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const id = Number(store.get('pp-user')?.value);
  if (!id) return null;
  return (q.getUser(id) as CurrentUser | undefined) ?? null;
}

// Матрица прав. Действия именованы по смыслу, не по HTTP-методам.
export function can(user: CurrentUser | null, action: string): boolean {
  if (!user) return false;
  const byRole: Record<string, string[]> = {
    admin: ['upload', 'view_orders', 'decide', 'export', 'edit_profiles', 'chat_profiles', 'admin', 'view_layout_tasks'],
    manager: ['upload', 'view_orders', 'decide', 'export', 'edit_profiles', 'chat_profiles', 'view_layout_tasks'],
    client: ['upload', 'view_orders'], // только свои заказы (фильтр в роуте)
    designer: ['view_orders', 'view_layout_tasks'], // только заказы с заданиями по макету
  };
  return byRole[user.role]?.includes(action) ?? false;
}

export function forbidden(reason = 'недостаточно прав') {
  return NextResponse.json({ error: reason }, { status: 403 });
}

export function unauthorized() {
  return NextResponse.json({ error: 'выберите пользователя' }, { status: 401 });
}

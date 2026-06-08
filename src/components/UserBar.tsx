'use client';
// Демо-переключатель пользователя (ACL): «кто я» в шапке. Роль определяет доступные разделы.
import { useEffect, useState } from 'react';
import Link from 'next/link';

export interface Me {
  id: number;
  name: string;
  role: 'admin' | 'manager' | 'client' | 'designer';
  clientProfileId: number | null;
}

export const ROLE_LABEL: Record<string, string> = {
  admin: 'админ',
  manager: 'менеджер',
  client: 'клиент',
  designer: 'дизайнер',
};

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<Me[]>([]);
  useEffect(() => {
    fetch('/api/auth').then((r) => r.json()).then((d) => { setMe(d.me); setUsers(d.users); });
  }, []);
  return { me, users, setMe };
}

export function UserBar({ me, users }: { me: Me | null; users: Me[] }) {
  async function switchUser(id: number) {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id }) });
    location.reload(); // роль меняет видимость данных — честная перезагрузка
  }
  return (
    <span className="userbar">
      {me?.role === 'admin' && <Link href="/admin">Админка</Link>}
      <select className="pe-input" style={{ width: 'auto' }} value={me?.id ?? ''} onChange={(e) => switchUser(Number(e.target.value))}>
        {!me && <option value="">кто вы?</option>}
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name} · {ROLE_LABEL[u.role]}</option>
        ))}
      </select>
    </span>
  );
}

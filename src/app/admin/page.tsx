'use client';
// Админка (role=admin): пользователи и клиенты (контакты, ответственный менеджер).
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { UserBar, useMe, ROLE_LABEL, type Me } from '@/components/UserBar';

interface ClientRow {
  id: number;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  managerUserId?: number | null;
}

export default function AdminPage() {
  const { me, users: switchUsers } = useMe();
  const [users, setUsers] = useState<Me[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [newUser, setNewUser] = useState({ name: '', role: 'manager', clientProfileId: '' });

  const load = useCallback(async () => {
    const [u, p] = await Promise.all([fetch('/api/auth').then((r) => r.json()), fetch('/api/profiles').then((r) => r.json())]);
    setUsers(u.users);
    setClients(p);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function userAction(body: Record<string, unknown>) {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) alert((await res.json()).error);
    load();
  }
  async function clientAction(body: Record<string, unknown>) {
    const res = await fetch('/api/admin/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) alert((await res.json()).error);
    load();
  }

  if (!me || me.role !== 'admin') {
    return (
      <div className="wrap">
        <p className="footnote" style={{ marginTop: '2rem' }}>Раздел доступен только администратору. <Link className="act" href="/">← к заказам</Link></p>
      </div>
    );
  }

  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  return (
    <div className="wrap">
      <header className="masthead">
        <Link className="brand" href="/">PrintProof</Link>
        <Link href="/">Заказы</Link>
        <Link href="/profiles">Профили</Link>
        <span>Админка</span>
        <span className="ctx" style={{ marginLeft: 'auto' }}><UserBar me={me} users={switchUsers} /></span>
      </header>
      <hr className="rule-double" />
      <hr className="rule-thin" />

      <h2 style={{ fontWeight: 400, margin: '1.5rem 0 0.5rem' }}>Пользователи и роли</h2>
      <table>
        <thead>
          <tr><th>Имя</th><th>Роль</th><th>Клиент (для роли «клиент»)</th><th>Действие</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name} <span className="mono pc-id">#{u.id}</span></td>
              <td>
                <select className="pe-input" style={{ width: 'auto' }} value={u.role} onChange={(e) => userAction({ id: u.id, role: e.target.value })}>
                  {Object.entries(ROLE_LABEL).map(([r, l]) => <option key={r} value={r}>{l}</option>)}
                </select>
              </td>
              <td>
                <select
                  className="pe-input" style={{ width: 'auto' }}
                  value={u.clientProfileId ?? ''}
                  onChange={(e) => userAction({ id: u.id, clientProfileId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">—</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
              <td><button className="linkish" style={{ color: 'var(--red)' }} onClick={() => userAction({ delete: u.id })}>удалить</button></td>
            </tr>
          ))}
          <tr>
            <td><input className="pe-input" placeholder="имя нового пользователя" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} /></td>
            <td>
              <select className="pe-input" style={{ width: 'auto' }} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                {Object.entries(ROLE_LABEL).map(([r, l]) => <option key={r} value={r}>{l}</option>)}
              </select>
            </td>
            <td>
              <select className="pe-input" style={{ width: 'auto' }} value={newUser.clientProfileId} onChange={(e) => setNewUser({ ...newUser, clientProfileId: e.target.value })}>
                <option value="">—</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </td>
            <td>
              <button
                className="linkish" disabled={!newUser.name.trim()}
                onClick={() => { userAction({ name: newUser.name, role: newUser.role, clientProfileId: newUser.clientProfileId ? Number(newUser.clientProfileId) : null }); setNewUser({ name: '', role: 'manager', clientProfileId: '' }); }}
              >+ добавить</button>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontWeight: 400, margin: '2rem 0 0.5rem' }}>Клиенты</h2>
      <p className="footnote">клиент = профиль корректуры + контакты + ответственный менеджер; правила и стиль правятся в разделе «Профили»</p>
      <table>
        <thead>
          <tr><th>Клиент</th><th>E-mail</th><th>Телефон</th><th>Ответственный менеджер</th></tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>{c.name} <span className="mono pc-id">#{c.id}</span></td>
              <td>
                <input
                  className="pe-input" defaultValue={c.contactEmail ?? ''} placeholder="client@example.com"
                  onBlur={(e) => e.target.value !== (c.contactEmail ?? '') && clientAction({ id: c.id, contactEmail: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="pe-input" defaultValue={c.contactPhone ?? ''} placeholder="+49 000 000 0000"
                  onBlur={(e) => e.target.value !== (c.contactPhone ?? '') && clientAction({ id: c.id, contactPhone: e.target.value })}
                />
              </td>
              <td>
                <select
                  className="pe-input" style={{ width: 'auto' }} value={c.managerUserId ?? ''}
                  onChange={(e) => clientAction({ id: c.id, managerUserId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">—</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

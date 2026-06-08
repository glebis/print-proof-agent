import { describe, it, expect } from 'vitest';
import { canAccessOrder } from '@/lib/order-access';

describe('object-level ACL: доступ к конкретному заказу', () => {
  const order = { id: 5, clientProfileId: 2 } as any;
  const hasLayout = () => true;

  it('admin и manager видят любой заказ', () => {
    expect(canAccessOrder({ role: 'admin', clientProfileId: null } as any, order, hasLayout)).toBe(true);
    expect(canAccessOrder({ role: 'manager', clientProfileId: null } as any, order, hasLayout)).toBe(true);
  });

  it('клиент видит только заказы своего профиля (Codex risk #2)', () => {
    expect(canAccessOrder({ role: 'client', clientProfileId: 2 } as any, order, hasLayout)).toBe(true);
    expect(canAccessOrder({ role: 'client', clientProfileId: 9 } as any, order, hasLayout)).toBe(false);
  });

  it('дизайнер видит только заказы с заданиями по макету', () => {
    expect(canAccessOrder({ role: 'designer', clientProfileId: null } as any, order, () => true)).toBe(true);
    expect(canAccessOrder({ role: 'designer', clientProfileId: null } as any, order, () => false)).toBe(false);
  });

  it('без пользователя — нет доступа', () => {
    expect(canAccessOrder(null, order, hasLayout)).toBe(false);
  });
});

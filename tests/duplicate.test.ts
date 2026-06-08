import { describe, it, expect } from 'vitest';
import { findDuplicateOrder } from '@/lib/duplicate';

describe('детектор дубликатов', () => {
  const orders = [
    { id: 5, textHash: 'abc123', filename: 'Буклет.pdf', status: 'done' },
    { id: 7, textHash: 'def456', filename: 'Листовка.png', status: 'review' },
    { id: 9, textHash: 'abc123', filename: 'Буклет v2.pdf', status: 'review' },
  ] as any[];

  it('находит последний заказ с тем же hash, исключая текущий', () => {
    const d = findDuplicateOrder(orders, 'abc123', 10);
    expect(d?.id).toBe(9); // самый свежий дубль
  });

  it('не считает заказ дубликатом самого себя', () => {
    expect(findDuplicateOrder(orders, 'abc123', 9)?.id).toBe(5);
  });

  it('нет совпадений или пустой hash → null', () => {
    expect(findDuplicateOrder(orders, 'zzz', 10)).toBeNull();
    expect(findDuplicateOrder(orders, '', 10)).toBeNull();
    expect(findDuplicateOrder(orders, null as any, 10)).toBeNull();
  });
});

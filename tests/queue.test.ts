import { describe, it, expect } from 'vitest';
import { planCheck, pickNextQueued, CHECK_CONCURRENCY } from '@/lib/queue';

describe('очередь проверок', () => {
  it('запускает сразу, пока активных меньше лимита', () => {
    expect(planCheck(0)).toBe('run');
    expect(planCheck(CHECK_CONCURRENCY - 1)).toBe('run');
  });

  it('ставит в очередь при достижении лимита', () => {
    expect(planCheck(CHECK_CONCURRENCY)).toBe('queue');
    expect(planCheck(CHECK_CONCURRENCY + 5)).toBe('queue');
  });

  it('из очереди берётся самый старый заказ', () => {
    const orders = [
      { id: 7, status: 'queued', createdAt: '2026-06-07 10:05' },
      { id: 5, status: 'queued', createdAt: '2026-06-07 10:01' },
      { id: 9, status: 'review', createdAt: '2026-06-07 09:00' }, // не в очереди
    ] as any[];
    expect(pickNextQueued(orders)?.id).toBe(5);
  });

  it('пустая очередь → null', () => {
    expect(pickNextQueued([{ id: 1, status: 'done', createdAt: '' } as any])).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { canRecheck } from '@/lib/recheck';

describe('перепроверка заказа', () => {
  it('разрешена из review/done/error — менеджер мог изменить профиль или словарь', () => {
    expect(canRecheck('review')).toBe(true);
    expect(canRecheck('done')).toBe(true);
    expect(canRecheck('error')).toBe(true);
  });

  it('запрещена, пока заказ обрабатывается или в очереди', () => {
    expect(canRecheck('checking')).toBe(false);
    expect(canRecheck('queued')).toBe(false);
    expect(canRecheck('uploaded')).toBe(false);
    expect(canRecheck('estimated')).toBe(false);
  });
});

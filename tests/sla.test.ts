import { describe, it, expect } from 'vitest';
import { slaStatus } from '@/lib/sla';

describe('SLA-бейдж: укладываемся ли в оценку времени', () => {
  const created = '2026-06-07 10:00:00';

  it('в работе и в пределах оценки → ok', () => {
    const s = slaStatus({ status: 'checking', createdAt: created, etaMinutes: 5 }, new Date('2026-06-07T10:03:00Z'));
    expect(s).toEqual({ state: 'ok', overdueMinutes: 0 });
  });

  it('в работе дольше оценки → overdue с количеством минут', () => {
    const s = slaStatus({ status: 'checking', createdAt: created, etaMinutes: 5 }, new Date('2026-06-07T10:12:00Z'));
    expect(s.state).toBe('overdue');
    expect(s.overdueMinutes).toBe(7);
  });

  it('завершённые и ошибочные не оцениваются', () => {
    expect(slaStatus({ status: 'done', createdAt: created, etaMinutes: 5 }, new Date('2026-06-08T00:00:00Z')).state).toBe('n/a');
    expect(slaStatus({ status: 'review', createdAt: created, etaMinutes: 5 }, new Date('2026-06-08T00:00:00Z')).state).toBe('n/a');
  });

  it('без оценки → n/a', () => {
    expect(slaStatus({ status: 'checking', createdAt: created, etaMinutes: undefined }, new Date()).state).toBe('n/a');
  });
});

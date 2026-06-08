import { describe, it, expect } from 'vitest';
import { computeSummary } from '@/lib/stats';

describe('сводная статистика для руководства', () => {
  const orders = [
    { id: 1, status: 'done', estimate: { chars: 1000, etaMinutes: 2, priceEur: 0.6 } },
    { id: 2, status: 'review', estimate: { chars: 2000, etaMinutes: 3, priceEur: 1.0 } },
    { id: 3, status: 'checking', estimate: null },
    { id: 4, status: 'error', estimate: { chars: 500, etaMinutes: 1, priceEur: 0.6 } },
  ] as any[];
  const protocols = [
    { ruleMs: 1, ruleCount: 4, llmMs: 9000, llmCount: 3, merged: 0, total: 7 },
    { ruleMs: 2, ruleCount: 2, llmMs: 11000, llmCount: 2, merged: 1, total: 4 },
  ];

  it('считает заказы, объём, тариф и среднее время проверки', () => {
    const s = computeSummary(orders, protocols, { accepted: 9, rejected: 2 });
    expect(s.ordersTotal).toBe(4);
    expect(s.ordersDone).toBe(1);
    expect(s.charsTotal).toBe(3500);
    expect(s.tariffTotalEur).toBeCloseTo(2.2);
    expect(s.avgCheckSeconds).toBe(10); // (9000+11000)/2 = 10000 мс
    expect(s.editsFound).toBe(11); // 7 + 4
    expect(s.editsAccepted).toBe(9);
    expect(s.acceptRate).toBeCloseTo(9 / 11);
  });

  it('не делит на ноль при пустых данных', () => {
    const s = computeSummary([], [], { accepted: 0, rejected: 0 });
    expect(s.avgCheckSeconds).toBe(0);
    expect(s.acceptRate).toBe(0);
  });
});

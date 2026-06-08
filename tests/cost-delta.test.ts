import { describe, it, expect } from 'vitest';
import { costDelta } from '@/lib/cost-delta';

describe('оценка vs факт стоимости AI', () => {
  it('считает дельту и процент отклонения (факт в USD → EUR по курсу оценки)', () => {
    const d = costDelta({ tokenCostEur: 0.01 }, { costUsd: 0.02 }, 0.92);
    expect(d).not.toBeNull();
    expect(d!.actualEur).toBeCloseTo(0.0184);
    expect(d!.deltaEur).toBeCloseTo(0.0084);
    expect(d!.deltaPct).toBeCloseTo(84, 0);
  });

  it('факт дешевле оценки → отрицательная дельта', () => {
    const d = costDelta({ tokenCostEur: 0.02 }, { costUsd: 0.01 }, 0.92);
    expect(d!.deltaEur).toBeLessThan(0);
  });

  it('нет факта или нулевая оценка → null (нечего сравнивать)', () => {
    expect(costDelta({ tokenCostEur: 0.01 }, null, 0.92)).toBeNull();
    expect(costDelta({ tokenCostEur: 0 }, { costUsd: 0.01 }, 0.92)).toBeNull();
  });
});

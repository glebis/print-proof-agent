// Оценка vs факт стоимости AI: насколько прогноз токенов попал в реальность.
export interface CostDelta {
  estimateEur: number;
  actualEur: number;
  deltaEur: number;
  deltaPct: number; // +84 → факт на 84% дороже оценки
}

export function costDelta(
  estimate: { tokenCostEur: number } | null | undefined,
  actual: { costUsd: number } | null | undefined,
  usdToEur: number,
): CostDelta | null {
  if (!estimate?.tokenCostEur || !actual || !Number.isFinite(actual.costUsd)) return null;
  const actualEur = actual.costUsd * usdToEur;
  const deltaEur = actualEur - estimate.tokenCostEur;
  return {
    estimateEur: estimate.tokenCostEur,
    actualEur: Math.round(actualEur * 10000) / 10000,
    deltaEur: Math.round(deltaEur * 10000) / 10000,
    deltaPct: Math.round((deltaEur / estimate.tokenCostEur) * 100),
  };
}

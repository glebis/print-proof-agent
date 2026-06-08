import { describe, it, expect } from 'vitest';
import { extractUsage, sumUsage } from '@/lib/usage';

describe('фактический расход AI из result-сообщений Agent SDK', () => {
  const resultMsg = {
    type: 'result', subtype: 'success',
    total_cost_usd: 0.0123,
    usage: { input_tokens: 900, output_tokens: 250, cache_read_input_tokens: 100 },
  };

  it('извлекает токены и стоимость из result-сообщения', () => {
    expect(extractUsage(resultMsg)).toEqual({ inputTokens: 1000, outputTokens: 250, costUsd: 0.0123 });
  });

  it('терпит отсутствие usage (возвращает нули, не падает)', () => {
    expect(extractUsage({ type: 'result', subtype: 'success' })).toEqual({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
    expect(extractUsage(null)).toEqual({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
  });

  it('суммирует расход нескольких pass-ов (llm + vision×страницы)', () => {
    const total = sumUsage([
      { inputTokens: 1000, outputTokens: 250, costUsd: 0.01 },
      { inputTokens: 2000, outputTokens: 600, costUsd: 0.03 },
    ]);
    expect(total).toEqual({ inputTokens: 3000, outputTokens: 850, costUsd: 0.04 });
  });
});

// Фактический расход AI: usage и стоимость из result-сообщений Agent SDK.
// Кэш-чтения считаем во входные токены (для прозрачности «сколько модель прочитала»).

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export function extractUsage(resultMessage: any): Usage {
  const u = resultMessage?.usage ?? {};
  return {
    inputTokens: (Number(u.input_tokens) || 0) + (Number(u.cache_read_input_tokens) || 0) + (Number(u.cache_creation_input_tokens) || 0),
    outputTokens: Number(u.output_tokens) || 0,
    costUsd: Number(resultMessage?.total_cost_usd) || 0,
  };
}

export function sumUsage(parts: Usage[]): Usage {
  return parts.reduce(
    (acc, p) => ({
      inputTokens: acc.inputTokens + p.inputTokens,
      outputTokens: acc.outputTokens + p.outputTokens,
      costUsd: Math.round((acc.costUsd + p.costUsd) * 10000) / 10000,
    }),
    { inputTokens: 0, outputTokens: 0, costUsd: 0 },
  );
}

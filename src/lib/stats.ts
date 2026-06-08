// Сводная статистика для руководства: заказы, объёмы, тариф, скорость, доля принятых.
import type { Order } from '@/lib/types';

interface ProtocolStats {
  ruleMs: number;
  ruleCount: number;
  llmMs: number;
  llmCount: number;
  merged: number;
  total: number;
}

export interface Summary {
  ordersTotal: number;
  ordersDone: number;
  charsTotal: number;
  tariffTotalEur: number;
  avgCheckSeconds: number;
  editsFound: number;
  editsAccepted: number;
  acceptRate: number;
}

export function computeSummary(
  orders: Pick<Order, 'status' | 'estimate'>[],
  protocols: ProtocolStats[],
  decisions: { accepted: number; rejected: number },
): Summary {
  const editsFound = protocols.reduce((s, p) => s + p.total, 0);
  const checkMs = protocols.map((p) => p.ruleMs + p.llmMs);
  return {
    ordersTotal: orders.length,
    ordersDone: orders.filter((o) => o.status === 'done').length,
    charsTotal: orders.reduce((s, o) => s + (o.estimate?.chars ?? 0), 0),
    tariffTotalEur: Math.round(orders.reduce((s, o) => s + (o.estimate?.priceEur ?? 0), 0) * 100) / 100,
    avgCheckSeconds: checkMs.length ? Math.round(checkMs.reduce((a, b) => a + b, 0) / checkMs.length / 1000) : 0,
    editsFound,
    editsAccepted: decisions.accepted,
    acceptRate: editsFound ? decisions.accepted / editsFound : 0,
  };
}

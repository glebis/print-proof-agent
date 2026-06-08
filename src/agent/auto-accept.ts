// Авто-принятие безопасных правок: только при явном opt-in профиля.
// Guardrails: только детерминированные источники (rule-pass/profile), не «важные»,
// уверенность не ниже порога. Менеджер видит авто-решения и может отменить до экспорта.
import type { EditCandidate } from '@/lib/types';

export interface AutoAcceptRules {
  autoAccept?: boolean;
  autoAcceptThreshold?: number; // по умолчанию 0.97
}

const DEFAULT_THRESHOLD = 0.97;
const SAFE_SOURCES = new Set(['rule-pass', 'profile']);

/** Возвращает индексы правок, которые безопасно принять автоматически. */
export function selectAutoAccept(edits: EditCandidate[], rules: AutoAcceptRules): number[] {
  if (!rules.autoAccept) return [];
  const threshold = rules.autoAcceptThreshold ?? DEFAULT_THRESHOLD;
  const out: number[] = [];
  edits.forEach((e, i) => {
    if (!SAFE_SOURCES.has(e.sourceModule)) return;
    if (e.severity === 'important') return; // важное решает только человек
    if (e.confidence < threshold) return;
    out.push(i);
  });
  return out;
}

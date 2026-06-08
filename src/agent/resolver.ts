// Resolver: дедуп и слияние конфликтующих правок. Код, не модель.
// Принцип: правки ссылаются на immutable base-ревизию; пересечение span'ов = конфликт,
// выживает более уверенная правка (при равенстве — rule-pass > llm-pass).
import type { EditCandidate } from '@/lib/types';

const SOURCE_PRIORITY: Record<string, number> = {
  'rule-pass': 3,
  profile: 3,
  'llm-pass': 2,
  'vision-pass': 1,
};

function overlaps(a: EditCandidate, b: EditCandidate): boolean {
  return a.spanStart < b.spanEnd && b.spanStart < a.spanEnd;
}

function better(a: EditCandidate, b: EditCandidate): EditCandidate {
  if (a.confidence !== b.confidence) return a.confidence > b.confidence ? a : b;
  return (SOURCE_PRIORITY[a.sourceModule] ?? 0) >= (SOURCE_PRIORITY[b.sourceModule] ?? 0) ? a : b;
}

export function resolveEdits(candidates: EditCandidate[]): EditCandidate[] {
  const sorted = [...candidates].sort((a, b) => a.spanStart - b.spanStart || a.spanEnd - b.spanEnd);
  const out: EditCandidate[] = [];

  for (const cand of sorted) {
    const clashIdx = out.findIndex((kept) => overlaps(kept, cand));
    if (clashIdx === -1) {
      out.push(cand);
      continue;
    }
    const kept = out[clashIdx];
    const isDuplicate = kept.spanStart === cand.spanStart && kept.spanEnd === cand.spanEnd && kept.suggested === cand.suggested;
    // и для дубля, и для конфликта — оставляем лучшую
    out[clashIdx] = better(kept, cand);
    void isDuplicate; // семантика одинакова; имя оставлено для читаемости
  }

  return out.sort((a, b) => a.spanStart - b.spanStart);
}

// Самообучение словаря: повторяющиеся принятые llm-замены — кандидаты в бренд-словарь профиля.
// Не предлагаем: уже существующее в словаре, отклонённое, rule-pass (и так детерминирован), длинные фразы.
import type { Edit } from '@/lib/types';

export interface DictionaryCandidate {
  wrong: string;
  right: string;
  count: number;
}

const MIN_REPEATS = 2;
const MAX_WORDS = 2; // словарная замена — слово или короткое словосочетание

export function suggestDictionaryCandidates(edits: Edit[], existing: Record<string, string>): DictionaryCandidate[] {
  const counts = new Map<string, DictionaryCandidate>();
  for (const e of edits) {
    if (e.decision !== 'accepted') continue;
    if (e.sourceModule !== 'llm-pass') continue;
    if (existing[e.original]) continue;
    if (e.original.trim().split(/\s+/).length > MAX_WORDS) continue;
    const key = `${e.original}→${e.suggested}`;
    const cur = counts.get(key) ?? { wrong: e.original, right: e.suggested, count: 0 };
    cur.count++;
    counts.set(key, cur);
  }
  return [...counts.values()].filter((c) => c.count >= MIN_REPEATS).sort((a, b) => b.count - a.count);
}

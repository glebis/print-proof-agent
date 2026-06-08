// Rule-pass: детерминированная типографика и словари клиента. Без LLM, 0 токенов.
import type { EditCandidate, ProfileRules } from '@/lib/types';

const CTX = 30; // символов контекста с каждой стороны

function ctx(text: string, start: number, end: number) {
  return {
    contextBefore: text.slice(Math.max(0, start - CTX), start),
    contextAfter: text.slice(end, end + CTX),
  };
}

function candidate(
  text: string,
  start: number,
  end: number,
  suggested: string,
  reason: string,
  source: 'rule-pass' | 'profile' = 'rule-pass',
): EditCandidate {
  return {
    spanStart: start,
    spanEnd: end,
    baseRevision: 1,
    original: text.slice(start, end),
    suggested,
    ...ctx(text, start, end),
    category: 'typography',
    severity: 'normal',
    confidence: source === 'rule-pass' ? 0.98 : 0.97,
    reason,
    sourceModule: source,
  };
}

export function runRulePass(text: string, baseRevision: number, profile?: ProfileRules): EditCandidate[] {
  const edits: EditCandidate[] = [];

  // 1. Дефис в роли тире: пробел-дефис-пробел или пробел-"-"-пробел
  for (const m of text.matchAll(/(?<= )(["']?-["']?)(?= )/g)) {
    const start = m.index!;
    edits.push(candidate(text, start, start + m[1].length, '—', 'правило typography/dash: дефис в роли тире'));
  }

  // 2. Прямые кавычки → ёлочки (парные внутри одного фрагмента без переноса строки)
  for (const m of text.matchAll(/"([^"\n]+)"/g)) {
    const inner = m[1];
    // не трогаем уже обработанный дефис-кейс ("-")
    if (inner.trim() === '-') continue;
    const start = m.index!;
    edits.push(
      candidate(text, start, start + m[0].length, `«${inner}»`, 'правило typography/quotes: кавычки-ёлочки « » в русском наборе'),
    );
  }

  // 3. Двойные пробелы
  for (const m of text.matchAll(/ {2,}/g)) {
    const start = m.index!;
    edits.push(candidate(text, start, start + m[0].length, ' ', 'правило typography/spaces: лишние пробелы'));
  }

  // 4. Бренд-словарь профиля клиента
  if (profile?.brandDictionary) {
    for (const [wrong, right] of Object.entries(profile.brandDictionary)) {
      let idx = 0;
      while ((idx = text.indexOf(wrong, idx)) !== -1) {
        // не предлагать замену, если уже совпадает с right в этом месте
        if (text.slice(idx, idx + right.length) !== right) {
          const e = candidate(text, idx, idx + wrong.length, right, `профиль клиента: словарь брендов («${wrong}» → «${right}»)`, 'profile');
          edits.push(e);
        }
        idx += wrong.length;
      }
    }
  }

  for (const e of edits) e.baseRevision = baseRevision;
  return edits;
}

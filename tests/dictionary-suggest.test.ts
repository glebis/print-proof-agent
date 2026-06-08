import { describe, it, expect } from 'vitest';
import { suggestDictionaryCandidates } from '@/lib/dictionary-suggest';
import type { Edit } from '@/lib/types';

function mk(p: Partial<Edit>): Edit {
  return {
    orderId: 1, spanStart: 0, spanEnd: 1, baseRevision: 1, original: 'x', suggested: 'y',
    contextBefore: '', contextAfter: '', category: 'spelling', severity: 'normal',
    confidence: 0.9, reason: 't', sourceModule: 'llm-pass', decision: 'accepted', ...p,
  };
}

describe('самообучение словаря: кандидаты из принятых правок', () => {
  it('предлагает повторяющиеся принятые llm-замены одного слова (≥2 раз)', () => {
    const edits = [
      mk({ original: 'Глобэкс', suggested: 'Globex' }),
      mk({ original: 'Глобэкс', suggested: 'Globex' }),
      mk({ original: 'опечатка', suggested: 'разовая' }), // 1 раз — не кандидат
    ];
    const c = suggestDictionaryCandidates(edits, {});
    expect(c).toEqual([{ wrong: 'Глобэкс', right: 'Globex', count: 2 }]);
  });

  it('не предлагает то, что уже в словаре, отклонённое и rule-pass (он и так детерминирован)', () => {
    const edits = [
      mk({ original: 'уже', suggested: 'есть' }),
      mk({ original: 'уже', suggested: 'есть' }),
      mk({ original: 'нет', suggested: 'решения', decision: 'rejected' }),
      mk({ original: 'нет', suggested: 'решения', decision: 'rejected' }),
      mk({ original: 'из', suggested: 'правил', sourceModule: 'rule-pass' }),
      mk({ original: 'из', suggested: 'правил', sourceModule: 'rule-pass' }),
    ];
    expect(suggestDictionaryCandidates(edits, { уже: 'есть' })).toEqual([]);
  });

  it('только короткие словарные замены — фразы из 3+ слов не словарь', () => {
    const edits = [
      mk({ original: 'очень длинная фраза целиком', suggested: 'другая длинная фраза тут' }),
      mk({ original: 'очень длинная фраза целиком', suggested: 'другая длинная фраза тут' }),
    ];
    expect(suggestDictionaryCandidates(edits, {})).toEqual([]);
  });
});

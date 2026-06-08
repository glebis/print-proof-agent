import { describe, it, expect } from 'vitest';
import { applySuggestionChange } from '@/lib/edit-suggestion';
import { applyAcceptedEdits } from '@/lib/export';
import type { Edit } from '@/lib/types';

const BASE = 'Печать - это качественая работа.';

function mk(p: Partial<Edit>): Edit {
  return {
    orderId: 1, spanStart: 0, spanEnd: 1, baseRevision: 1, original: 'x', suggested: 'y',
    contextBefore: '', contextAfter: '', category: 'spelling', severity: 'normal',
    confidence: 0.9, reason: 't', sourceModule: 'llm-pass', decision: 'accepted', ...p,
  };
}

describe('ручная правка предложения менеджером', () => {
  it('меняет suggested, сбрасывает decision в pending и помечает источник «менеджер»', () => {
    const e = mk({ suggested: 'качественная', decision: 'accepted' });
    const out = applySuggestionChange(e, 'высококачественная');
    expect(out.suggested).toBe('высококачественная');
    expect(out.decision).toBe('pending'); // новое предложение требует нового решения
    expect(out.reason).toContain('изменено менеджером');
    expect(out.original).toBe(e.original); // original неприкосновенен — это якорь ревизии
  });

  it('отклоняет пустое предложение и совпадающее с original', () => {
    const e = mk({ original: 'качественая' });
    expect(() => applySuggestionChange(e, '')).toThrow();
    expect(() => applySuggestionChange(e, 'качественая')).toThrow();
  });

  it('экспорт применяет изменённое менеджером предложение', () => {
    const start = BASE.indexOf('качественая');
    const e = mk({
      spanStart: start, spanEnd: start + 'качественая'.length,
      original: 'качественая', suggested: 'качественная',
    });
    const edited = { ...applySuggestionChange(e, 'превосходная'), decision: 'accepted' as const };
    expect(applyAcceptedEdits(BASE, [edited])).toBe('Печать - это превосходная работа.');
  });
});

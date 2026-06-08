import { describe, it, expect } from 'vitest';
import { searchEdits, sortEdits } from '@/lib/search-sort';
import type { Edit } from '@/lib/types';

function mk(p: Partial<Edit>): Edit {
  return {
    orderId: 1, spanStart: 0, spanEnd: 1, baseRevision: 1, original: 'x', suggested: 'y',
    contextBefore: '', contextAfter: '', category: 'spelling', severity: 'normal',
    confidence: 0.9, reason: 'причина', sourceModule: 'llm-pass', decision: 'pending', ...p,
  };
}

describe('поиск по правкам', () => {
  const edits = [
    mk({ original: 'качественая', suggested: 'качественная', reason: 'НН' }),
    mk({ original: 'Pantone', suggested: '«Pantone»', reason: 'кавычки' }),
  ];

  it('ищет в original, suggested и reason, без учёта регистра', () => {
    expect(searchEdits(edits, 'pantone')).toHaveLength(1);
    expect(searchEdits(edits, 'КАЧЕСТВ')).toHaveLength(1);
    expect(searchEdits(edits, 'кавычки')).toHaveLength(1);
  });

  it('пустой запрос — всё; нет совпадений — пусто', () => {
    expect(searchEdits(edits, '')).toHaveLength(2);
    expect(searchEdits(edits, 'zzz')).toHaveLength(0);
  });
});

describe('сортировка правок', () => {
  const edits = [
    mk({ spanStart: 50, confidence: 0.99, severity: 'normal' }),
    mk({ spanStart: 10, confidence: 0.7, severity: 'important' }),
    mk({ spanStart: 30, confidence: 0.9, severity: 'normal' }),
  ];

  it('по позиции в документе (по умолчанию)', () => {
    expect(sortEdits(edits, 'position').map((e) => e.spanStart)).toEqual([10, 30, 50]);
  });

  it('по уверенности: сомнительные сверху — их надо смотреть внимательнее', () => {
    expect(sortEdits(edits, 'confidence').map((e) => e.confidence)).toEqual([0.7, 0.9, 0.99]);
  });

  it('важные сверху, внутри — по позиции', () => {
    const s = sortEdits(edits, 'severity');
    expect(s[0].severity).toBe('important');
    expect(s.slice(1).map((e) => e.spanStart)).toEqual([30, 50]);
  });

  it('не мутирует исходный массив', () => {
    const before = edits.map((e) => e.spanStart);
    sortEdits(edits, 'position');
    expect(edits.map((e) => e.spanStart)).toEqual(before);
  });
});

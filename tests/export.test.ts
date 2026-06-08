import { describe, it, expect } from 'vitest';
import { applyAcceptedEdits } from '@/lib/export';
import type { Edit } from '@/lib/types';

const BASE = 'Мы рады: качественая печать - это размешение заказов.';

function mk(partial: Partial<Edit>): Edit {
  return {
    orderId: 1,
    spanStart: 0,
    spanEnd: 1,
    baseRevision: 1,
    original: 'x',
    suggested: 'y',
    contextBefore: '',
    contextAfter: '',
    category: 'spelling',
    severity: 'normal',
    confidence: 0.9,
    reason: 'test',
    sourceModule: 'llm-pass',
    decision: 'accepted',
    ...partial,
  };
}

describe('экспорт: сборка курсором по immutable-базе', () => {
  it('применяет несколько accepted-правок без сдвига offsets', () => {
    const e1 = mk({
      spanStart: BASE.indexOf('качественая'),
      spanEnd: BASE.indexOf('качественая') + 'качественая'.length,
      original: 'качественая',
      suggested: 'качественная',
    });
    const e2 = mk({
      spanStart: BASE.indexOf(' - '),
      spanEnd: BASE.indexOf(' - ') + 3,
      original: ' - ',
      suggested: ' — ',
    });
    const e3 = mk({
      spanStart: BASE.indexOf('размешение'),
      spanEnd: BASE.indexOf('размешение') + 'размешение'.length,
      original: 'размешение',
      suggested: 'размещение',
    });
    // подаём в перемешанном порядке — функция обязана отсортировать сама
    const out = applyAcceptedEdits(BASE, [e3, e1, e2]);
    expect(out).toBe('Мы рады: качественная печать — это размещение заказов.');
  });

  it('игнорирует rejected и pending', () => {
    const e1 = mk({
      spanStart: BASE.indexOf('качественая'),
      spanEnd: BASE.indexOf('качественая') + 'качественая'.length,
      original: 'качественая',
      suggested: 'качественная',
      decision: 'rejected',
    });
    expect(applyAcceptedEdits(BASE, [e1])).toBe(BASE);
  });

  it('бросает ошибку, если original не совпадает с base-текстом (защита ревизий)', () => {
    const bad = mk({ spanStart: 0, spanEnd: 2, original: 'ЖЖ', suggested: 'xx' });
    expect(() => applyAcceptedEdits(BASE, [bad])).toThrow(/ревизи/i);
  });

  it('бросает ошибку при пересекающихся accepted-правках', () => {
    const a = mk({ spanStart: 0, spanEnd: 5, original: BASE.slice(0, 5), suggested: 'A' });
    const b = mk({ spanStart: 3, spanEnd: 8, original: BASE.slice(3, 8), suggested: 'B' });
    expect(() => applyAcceptedEdits(BASE, [a, b])).toThrow(/пересека/i);
  });
});

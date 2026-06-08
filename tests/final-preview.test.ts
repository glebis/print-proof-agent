import { describe, it, expect } from 'vitest';
import { buildFinalSegments } from '@/lib/final-preview';
import type { Edit } from '@/lib/types';

const BASE = 'Печать - это качественая работа.';

function mk(p: Partial<Edit>): Edit {
  return {
    orderId: 1, spanStart: 0, spanEnd: 1, baseRevision: 1, original: 'x', suggested: 'y',
    contextBefore: '', contextAfter: '', category: 'spelling', severity: 'normal',
    confidence: 0.9, reason: 't', sourceModule: 'llm-pass', decision: 'accepted', ...p,
  };
}

describe('предпросмотр итогового текста', () => {
  it('собирает сегменты: kept / replaced(accepted) / pending-зоны остаются как в оригинале', () => {
    const dash = BASE.indexOf(' - ');
    const word = BASE.indexOf('качественая');
    const segs = buildFinalSegments(BASE, [
      mk({ spanStart: dash, spanEnd: dash + 3, original: ' - ', suggested: ' — ', decision: 'accepted' }),
      mk({ spanStart: word, spanEnd: word + 'качественая'.length, original: 'качественая', suggested: 'качественная', decision: 'pending' }),
    ]);
    // итоговый текст: тире применено, pending остаётся оригиналом
    const text = segs.map((s) => s.text).join('');
    expect(text).toBe('Печать — это качественая работа.');
    expect(segs.find((s) => s.type === 'replaced')?.text).toBe(' — ');
    expect(segs.find((s) => s.type === 'pending')?.text).toBe('качественая');
  });

  it('rejected-правки не меняют текст и не подсвечиваются', () => {
    const word = BASE.indexOf('качественая');
    const segs = buildFinalSegments(BASE, [
      mk({ spanStart: word, spanEnd: word + 'качественая'.length, original: 'качественая', suggested: 'другое', decision: 'rejected' }),
    ]);
    expect(segs.map((s) => s.text).join('')).toBe(BASE);
    expect(segs.every((s) => s.type === 'kept')).toBe(true);
  });

  it('без правок — один kept-сегмент', () => {
    const segs = buildFinalSegments(BASE, []);
    expect(segs).toEqual([{ text: BASE, type: 'kept' }]);
  });
});

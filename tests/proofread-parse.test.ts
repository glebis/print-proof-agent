import { describe, it, expect } from 'vitest';
import { parseAndLocate } from '@/agent/proofread';

const BASE = 'Мы рады: качественая печать на любых материалах. Снова качественая работа.';

describe('llm-pass: парсинг ответа и поиск span кодом', () => {
  it('находит span по context_before + original (различает повторы)', () => {
    const raw = JSON.stringify([
      {
        original: 'качественая',
        suggested: 'качественная',
        context_before: 'Снова ',
        category: 'spelling',
        severity: 'normal',
        confidence: 0.99,
        reason: 'НН',
      },
    ]);
    const out = parseAndLocate(raw, BASE, 1);
    expect(out).toHaveLength(1);
    // именно второе вхождение
    expect(out[0].spanStart).toBe(BASE.indexOf('Снова ') + 'Снова '.length);
    expect(BASE.slice(out[0].spanStart, out[0].spanEnd)).toBe('качественая');
    expect(out[0].sourceModule).toBe('llm-pass');
  });

  it('отбрасывает галлюцинации (фрагмент отсутствует в тексте)', () => {
    const raw = JSON.stringify([
      { original: 'несуществующий', suggested: 'фрагмент', context_before: '', category: 'spelling', severity: 'normal', confidence: 0.9, reason: 'x' },
    ]);
    expect(parseAndLocate(raw, BASE, 1)).toHaveLength(0);
  });

  it('терпит мусор вокруг JSON', () => {
    const raw = 'Вот правки:\n[{"original":"качественая","suggested":"качественная","context_before":"рады: ","category":"spelling","severity":"normal","confidence":0.99,"reason":"НН"}]\nГотово.';
    expect(parseAndLocate(raw, BASE, 1)).toHaveLength(1);
  });

  it('возвращает [] на невалидный ответ', () => {
    expect(parseAndLocate('извините, не смог', BASE, 1)).toHaveLength(0);
  });
});

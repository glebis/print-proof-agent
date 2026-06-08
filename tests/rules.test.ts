import { describe, it, expect } from 'vitest';
import { runRulePass } from '@/agent/rules';
import type { ProfileRules } from '@/lib/types';

const BOOKLET = `Весенняя коллекция 2026

Мы рады представить вам новую коллекцию тканей - качественая печать на любых материалах.

Наша типография предлагает размешение  заказов онлайн и доставку по всей стране "-" уже через три дня.

Все цвета печатаются по шкале "Pantone".`;

describe('rule-pass: типографика', () => {
  it('находит дефис вместо тире между пробелами', () => {
    const edits = runRulePass(BOOKLET, 1);
    const dash = edits.filter((e) => e.suggested === '—');
    expect(dash.length).toBeGreaterThanOrEqual(1);
    expect(dash[0].original).toBe('-');
    expect(dash[0].category).toBe('typography');
    expect(dash[0].sourceModule).toBe('rule-pass');
    // span указывает именно на дефис в base-тексте
    expect(BOOKLET.slice(dash[0].spanStart, dash[0].spanEnd)).toBe('-');
  });

  it('заменяет прямые кавычки на ёлочки', () => {
    const edits = runRulePass(BOOKLET, 1);
    const quotes = edits.filter((e) => e.suggested.includes('«'));
    expect(quotes.length).toBeGreaterThanOrEqual(1);
    const pantone = quotes.find((e) => e.original.includes('Pantone'));
    expect(pantone).toBeDefined();
    expect(pantone!.suggested).toBe('«Pantone»');
  });

  it('схлопывает двойные пробелы', () => {
    const edits = runRulePass(BOOKLET, 1);
    const dbl = edits.find((e) => e.original === '  ');
    expect(dbl).toBeDefined();
    expect(dbl!.suggested).toBe(' ');
  });

  it('применяет бренд-словарь из профиля клиента', () => {
    const rules: ProfileRules = { brandDictionary: { 'типография': 'типография «Печатный двор»' } };
    const edits = runRulePass('Наша типография работает.', 1, rules);
    const brand = edits.find((e) => e.sourceModule === 'profile');
    expect(brand).toBeDefined();
    expect(brand!.suggested).toContain('Печатный двор');
  });

  it('все span-координаты валидны относительно base-текста', () => {
    const edits = runRulePass(BOOKLET, 1);
    for (const e of edits) {
      expect(BOOKLET.slice(e.spanStart, e.spanEnd)).toBe(e.original);
    }
  });
});

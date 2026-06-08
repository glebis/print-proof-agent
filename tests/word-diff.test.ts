import { describe, it, expect } from 'vitest';
import { diffWords } from '@/lib/word-diff';

describe('word-diff в карточке правки', () => {
  it('находит общий префикс/суффикс и выделяет минимальную вставку', () => {
    const d = diffWords('качественая', 'качественная');
    expect(d.prefix).toBe('качествен');
    expect(d.removed).toBe('');
    expect(d.added).toBe('н');
    expect(d.suffix).toBe('ая');
  });

  it('замена слова целиком', () => {
    const d = diffWords('размешение', 'размещение');
    expect(d.prefix).toBe('разме');
    expect(d.removed).toBe('ш');
    expect(d.added).toBe('щ');
    expect(d.suffix).toBe('ение');
  });

  it('полная замена без общих частей', () => {
    const d = diffWords('абв', 'где');
    expect(d).toEqual({ prefix: '', removed: 'абв', added: 'где', suffix: '' });
  });

  it('чистая вставка', () => {
    const d = diffWords('от 3 до 5', 'от 3 и до 5');
    expect(d.removed).toBe('');
    expect(d.added).toBe('и ');
  });
});

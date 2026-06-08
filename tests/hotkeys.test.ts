import { describe, it, expect } from 'vitest';
import { mapKeyToAction } from '@/lib/hotkeys';

describe('хоткеи приёмки', () => {
  it('j/k и стрелки — навигация по правкам', () => {
    expect(mapKeyToAction('j')).toEqual({ type: 'next' });
    expect(mapKeyToAction('k')).toEqual({ type: 'prev' });
    expect(mapKeyToAction('ArrowDown')).toEqual({ type: 'next' });
    expect(mapKeyToAction('ArrowUp')).toEqual({ type: 'prev' });
  });

  it('a/r — принять/отклонить выбранную', () => {
    expect(mapKeyToAction('a')).toEqual({ type: 'accept' });
    expect(mapKeyToAction('r')).toEqual({ type: 'reject' });
  });

  it('кириллическая раскладка работает (ф=a, к=r, о=j, л=k)', () => {
    expect(mapKeyToAction('ф')).toEqual({ type: 'accept' });
    expect(mapKeyToAction('к')).toEqual({ type: 'reject' });
    expect(mapKeyToAction('о')).toEqual({ type: 'next' });
    expect(mapKeyToAction('л')).toEqual({ type: 'prev' });
  });

  it('прочие клавиши игнорируются', () => {
    expect(mapKeyToAction('Enter')).toBeNull();
    expect(mapKeyToAction('z')).toBeNull();
  });
});

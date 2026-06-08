// Хоткеи приёмки: j/k (о/л) — навигация, a/r (ф/к) — решение. Раскладко-независимо.
export type HotkeyAction = { type: 'next' | 'prev' | 'accept' | 'reject' };

const MAP: Record<string, HotkeyAction['type']> = {
  j: 'next', о: 'next', ArrowDown: 'next',
  k: 'prev', л: 'prev', ArrowUp: 'prev',
  a: 'accept', ф: 'accept',
  r: 'reject', к: 'reject',
};

export function mapKeyToAction(key: string): HotkeyAction | null {
  const t = MAP[key];
  return t ? { type: t } : null;
}

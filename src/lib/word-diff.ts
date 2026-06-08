// Минимальный диф: общий префикс/суффикс, изменённая сердцевина.
// Для коротких правок корректора этого достаточно и читается лучше полного LCS.
export interface WordDiff {
  prefix: string;
  removed: string;
  added: string;
  suffix: string;
}

export function diffWords(original: string, suggested: string): WordDiff {
  let p = 0;
  while (p < original.length && p < suggested.length && original[p] === suggested[p]) p++;
  let s = 0;
  while (
    s < original.length - p &&
    s < suggested.length - p &&
    original[original.length - 1 - s] === suggested[suggested.length - 1 - s]
  ) s++;
  return {
    prefix: original.slice(0, p),
    removed: original.slice(p, original.length - s),
    added: suggested.slice(p, suggested.length - s),
    suffix: original.slice(original.length - s),
  };
}

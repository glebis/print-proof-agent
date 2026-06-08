// Поиск и сортировка правок на приёмке.
import type { Edit } from '@/lib/types';

export function searchEdits(edits: Edit[], query: string): Edit[] {
  const q = query.trim().toLowerCase();
  if (!q) return edits;
  return edits.filter((e) =>
    [e.original, e.suggested, e.reason].some((f) => f.toLowerCase().includes(q)),
  );
}

export type SortMode = 'position' | 'confidence' | 'severity';

export function sortEdits(edits: Edit[], mode: SortMode): Edit[] {
  const out = [...edits];
  if (mode === 'confidence') return out.sort((a, b) => a.confidence - b.confidence); // сомнительные сверху
  if (mode === 'severity')
    return out.sort((a, b) => {
      const imp = (e: Edit) => (e.severity === 'important' ? 0 : 1);
      return imp(a) - imp(b) || a.spanStart - b.spanStart;
    });
  return out.sort((a, b) => a.spanStart - b.spanStart);
}
